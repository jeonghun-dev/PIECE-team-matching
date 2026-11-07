import { useState } from "react";
import "./AnswerList.css";

export default function AnswerList({
  answers = [],
  currentUserId = null,
  questionAuthorId = null,
  isSolved = false,
  isMutating = false,
  onUpdateAnswer,
  onDeleteAnswer,
  onAcceptAnswer,
}) {
  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [actionAnswerId, setActionAnswerId] = useState(null);
  const isBusy = isSaving || isDeleting || isAccepting || isMutating;

  // 답변 수정 시작
  function handleEdit(answer) {
    setEditingAnswerId(answer.id);
    setEditContent(answer.content);
  }

  // 답변 수정 취소
  function handleCancel() {
    setEditingAnswerId(null);
    setEditContent("");
  }

  // 답변 수정 저장
  async function handleSave(answerId) {
    if (isBusy) {
      return;
    }

    const trimmedContent = editContent.trim();

    if (!trimmedContent) {
      window.alert("답변 내용을 입력해 주세요.");
      return;
    }

    if (typeof onUpdateAnswer !== "function") {
      return;
    }

    setIsSaving(true);

    try {
      await onUpdateAnswer(answerId, trimmedContent);
      handleCancel();
    } catch (error) {
      window.alert(
        error.response?.data?.message ||
          error.message ||
          "답변 수정에 실패했습니다. 다시 시도해 주세요.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  // 답변 삭제
  async function handleDelete(answerId) {
    if (isBusy || typeof onDeleteAnswer !== "function") {
      return;
    }

    const confirmed = window.confirm("정말 이 답변을 삭제하시겠습니까?");

    if (!confirmed) {
      return;
    }
    setActionAnswerId(answerId);
    setIsDeleting(true);

    try {
      await onDeleteAnswer(answerId);
    } catch (error) {
      window.alert(
        error.response?.data?.message ||
          error.message ||
          "답변 삭제에 실패했습니다. 다시 시도해 주세요.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  // 답변 채택
  async function handleAccept(answerId) {
    if (isBusy || isSolved || typeof onAcceptAnswer !== "function") {
      return;
    }

    const confirmed = window.confirm(
      "이 답변을 채택하시겠습니까? 채택 후에는 변경할 수 없습니다.",
    );

    if (!confirmed) {
      return;
    }
    setActionAnswerId(answerId);
    setIsAccepting(true);

    try {
      await onAcceptAnswer(answerId);
    } catch (error) {
      window.alert(
        error.response?.data?.message ||
          error.message ||
          "답변 채택에 실패했습니다. 다시 시도해 주세요.",
      );
    } finally {
      setIsAccepting(false);
    }
  }
  return (
    <section className="answer-list" aria-label="답변 목록">
      <h2 className="answer-list__title">
        답변 <span>{answers.length}</span>
      </h2>

      {answers.length === 0 ? (
        <p className="answer-list__empty">
          아직 답변이 없습니다. 첫 답변을 작성해 보세요.
        </p>
      ) : (
        <div className="answer-list__items">
          {answers.map((answer) => {
            const isAuthor =
              currentUserId != null &&
              answer.authorId != null &&
              Number(answer.authorId) === Number(currentUserId);

            const isEditing = isAuthor && editingAnswerId === answer.id;

            const canAcceptAnswer =
              currentUserId != null &&
              questionAuthorId != null &&
              answer.authorId != null &&
              Number(currentUserId) === Number(questionAuthorId) &&
              !isAuthor &&
              !isSolved &&
              !answer.isAccepted;

            return (
              <article
                key={answer.id}
                className={
                  answer.isAccepted
                    ? "answer-card answer-card--accepted"
                    : "answer-card"
                }
              >
                {/* 답변 작성자 정보 */}
                <header className="answer-card__header">
                  {answer.isAccepted && (
                    <span className="answer-card__accepted">채택된 답변</span>
                  )}

                  <strong className="answer-card__author">
                    {answer.authorNickname}
                  </strong>

                  <span className="answer-card__level">
                    {answer.authorLevel} · {answer.authorScore}점
                  </span>
                </header>

                {/* 답변 내용 또는 수정 입력창 */}
                {isEditing ? (
                  <textarea
                    className="answer-card__textarea"
                    value={editContent}
                    onChange={(event) => setEditContent(event.target.value)}
                    aria-label="답변 수정 내용"
                    disabled={isBusy}
                  />
                ) : (
                  <p className="answer-card__content">{answer.content}</p>
                )}

                {/* 질문 작성자에게 표시하는 채택 버튼 */}
                {canAcceptAnswer && (
                  <div className="answer-card__actions">
                    <button
                      type="button"
                      disabled={isBusy}
                      className="answer-card__accept"
                      onClick={() => handleAccept(answer.id)}
                    >
                      {isAccepting && actionAnswerId === answer.id
                        ? "채택 중..."
                        : "답변 채택"}
                    </button>
                  </div>
                )}
                {/* 본인 답변일 때만 버튼 표시 */}
                {isAuthor && (
                  <div className="answer-card__actions">
                    {isEditing ? (
                      <>
                        {/* 수정 중: 저장 · 취소 */}
                        <button
                          type="button"
                          disabled={isBusy}
                          className="answer-card__edit"
                          onClick={() => handleSave(answer.id)}
                        >
                          {isSaving ? "저장 중..." : "저장"}
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          className="answer-card__edit"
                          onClick={handleCancel}
                        >
                          취소
                        </button>
                      </>
                    ) : (
                      <>
                        {/* 일반 상태: 수정 · 삭제 */}
                        <button
                          type="button"
                          disabled={isBusy}
                          className="answer-card__edit"
                          onClick={() => handleEdit(answer)}
                        >
                          수정
                        </button>

                        {!answer.isAccepted && (
                          <button
                            type="button"
                            disabled={isBusy}
                            className="answer-card__delete"
                            onClick={() => handleDelete(answer.id)}
                          >
                            {isDeleting && actionAnswerId === answer.id
                              ? "삭제 중..."
                              : "삭제"}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
