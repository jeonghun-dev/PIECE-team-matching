import { useState } from "react";
import "./AnswerForm.css";

export default function AnswerForm({ onSubmit, isSubmitting = false }) {
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isBusy = isSubmitting || isSaving;

  async function handleSubmit(event) {
    event.preventDefault();

    if (isBusy) {
      return;
    }

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setErrorMessage("답변 내용을 입력해 주세요.");
      return;
    }

    setErrorMessage("");
    setIsSaving(true);

    try {
      // 등록 성공이 성공한 뒤에만 입력 내용을 비움
      await onSubmit(trimmedContent);
      setContent("");
    } catch (error) {
      // 실패하면 작성한 내용은 유지
      setErrorMessage(
        error.response?.data?.message ||
          "답변 등록에 실패했습니다. 다시 시도해 주세요.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="answer-form" onSubmit={handleSubmit}>
      <textarea
        className="answer-form__textarea"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="답변을 입력해 주세요."
        aria-label="답변 내용"
        disabled={isBusy}
      />

      {errorMessage && <p role="alert">{errorMessage}</p>}

      <button className="answer-form__submit" type="submit" disabled={isBusy}>
        {isBusy ? "등록 중..." : "답변 등록"}
      </button>
    </form>
  );
}
