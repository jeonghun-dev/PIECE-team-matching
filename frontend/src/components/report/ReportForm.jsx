import { useId, useRef, useState } from "react";
import { REPORT_REASON_OPTIONS } from "../../constants";
import "./ReportForm.css";

export default function ReportForm({ onSubmit, onCancel }) {
  const formId = useId();
  const submitLockRef = useRef(false);

  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitLockRef.current) {
      return;
    }

    if (!reason) {
      setErrorMessage("신고 사유를 선택해 주세요.");
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await onSubmit({
        reason,
        detail: detail.trim() || null,
      });
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "신고 접수에 실패했습니다. 다시 시도해 주세요.",
      );
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form className="report-form" onSubmit={handleSubmit}>
      <h2 className="report-form__title">신고하기</h2>

      <label htmlFor={`${formId}-reason`}>신고 사유</label>
      <select
        id={`${formId}-reason`}
        className="report-form__input"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        disabled={isSubmitting}
        required
      >
        <option value="">사유를 선택해 주세요</option>
        {REPORT_REASON_OPTIONS.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>

      <label htmlFor={`${formId}-detail`}>상세 내용 (선택)</label>
      <textarea
        id={`${formId}-detail`}
        className="report-form__input report-form__textarea"
        value={detail}
        onChange={(event) => setDetail(event.target.value)}
        maxLength={500}
        disabled={isSubmitting}
        placeholder="신고 내용을 구체적으로 적어 주세요."
        aria-describedby={`${formId}-count`}
      />

      <p id={`${formId}-count`} className="report-form__count">
        {detail.length} / 500자
      </p>

      {errorMessage && (
        <p className="report-form__error" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="report-form__actions">
        <button
          type="button"
          className="report-form__cancel"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          취소
        </button>

        <button
          type="submit"
          className="report-form__submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "신고 접수 중..." : "신고 접수"}
        </button>
      </div>
    </form>
  );
}
