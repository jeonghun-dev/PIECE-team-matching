import { useEffect, useRef, useState } from "react";
import { createProjectQuestion, getProjectQuestions } from "../../api/projectDetail";
import { deleteQuestion, updateQuestion } from "../../api/questions";
import AnswerSection from "../../components/answer/AnswerSection";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import { LEVEL, USER_ROLE } from "../../constants";
import "./ProjectQuestionSection.css";


// 모집 글 질문은 별도 목록 API를 사용하고, 답변은 기존 공통 컴포넌트에 맡긴다.
export default function ProjectQuestionSection({ projectId, user }) {
  const isAdmin = user?.role === USER_ROLE.ADMIN;
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const lock = useRef(false);
  const active = useRef(true);
  const listVersion = useRef(0);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      listVersion.current += 1;
    };
  }, []);

  useEffect(() => {
    const version = ++listVersion.current;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await getProjectQuestions(projectId);
        if (active.current && version === listVersion.current) setQuestions(response.data.data);
      } catch {
        if (active.current && version === listVersion.current)
          setError("질문을 불러오지 못했습니다. 다시 시도해 주세요.");
      } finally {
        if (active.current && version === listVersion.current) setLoading(false);
      }
    }
    load();
    return () => {
      listVersion.current += 1;
    };
  }, [projectId, retryCount]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (lock.current) return;
    const value = content.trim();
    if (!value || value.length > 2000) {
      setSaveError("질문은 공백을 제외한 내용이 있어야 하며 2,000자 이내로 입력해 주세요.");
      return;
    }
    lock.current = true;
    setSaving(true);
    setSaveError("");
    try {
      // 기존 질문 API는 제목도 필수이므로 본문의 첫 200자를 제목으로 전달한다.
      await createProjectQuestion(projectId, { title: value.slice(0, 200), content: value });
      if (active.current) {
        setContent("");
        setRetryCount((prev) => prev + 1);
      }
    } catch (requestError) {
      if (active.current)
        setSaveError(
          requestError.response?.data?.message ||
          "질문을 등록하지 못했습니다. 입력 내용을 확인하고 다시 시도해 주세요."
        );
    } finally {
      lock.current = false;
      if (active.current) setSaving(false);
    }
  }

  function handleChanged(updated) {
    listVersion.current += 1;
    setQuestions((prev) =>
      updated.deleted
        ? prev.filter((question) => question.id !== updated.id)
        : prev.map((question) =>
          question.id === updated.id ? { ...question, ...updated } : question
        )
    );
  }

  return (
    <section className="project-detail-panel project-questions" aria-label="모집 글 질문과 답변">
      <h2>
        질문 · 답변{" "}
        {!loading && !error && <span className="project-detail-count">{questions.length}</span>}
      </h2>
      {!isAdmin && (

        <form className="project-question-form" onSubmit={handleSubmit}>
          <label className="project-detail-visually-hidden" htmlFor={`project-question-${projectId}`}>
            프로젝트 질문 내용
          </label>
          <textarea
            id={`project-question-${projectId}`}
            placeholder="프로젝트에 대해 궁금한 점을 질문해 보세요"
            maxLength={2000}
            value={content}
            disabled={saving}
            aria-invalid={Boolean(saveError)}
            aria-describedby={saveError ? `project-question-error-${projectId}` : undefined}
            onChange={(event) => {
              setContent(event.target.value);
              setSaveError("");
            }}
          />
          <button
            className="project-question-button project-question-button--primary"
            type="submit"
            disabled={saving}
          >
            {saving ? "등록 중…" : "질문 등록"}
          </button>
          {saveError && (
            <p
              className="project-detail-error"
              id={`project-question-error-${projectId}`}
              role="alert"
            >
              {saveError}
            </p>
          )}
        </form>
      )}
      {loading ? (
        <p role="status">질문을 불러오는 중입니다.</p>
      ) : error ? (
        <div>
          <p role="alert">{error}</p>
          <button
            className="project-question-button"
            type="button"
            onClick={() => setRetryCount((prev) => prev + 1)}
          >
            다시 시도
          </button>
        </div>
      ) : questions.length === 0 ? (
        <p className="project-detail-muted">아직 질문이 없습니다. 첫 질문을 작성해 보세요.</p>
      ) : (
        questions.map((question) => (
          <ProjectQuestion
            key={question.id}
            question={question}
            user={user}
            onChanged={handleChanged}
          />
        ))
      )}
    </section>
  );
}

function ProjectQuestion({ question, user, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(question.content);
  const [action, setAction] = useState("");
  const [error, setError] = useState("");
  const lock = useRef(false);
  const active = useRef(true);
  const editInput = useRef(null);
  const editTrigger = useRef(null);
  const isOwner = user?.id != null && String(user.id) === String(question.authorId);
  const time = formatRelativeTime(question.createdAt);
  const hasLevel = Object.values(LEVEL).includes(question.authorLevel);
  const authorScore = question.authorScore == null ? null : Number(question.authorScore);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    if (editing) editInput.current?.focus();
  }, [editing]);

  async function mutate(kind) {
    if (lock.current || !isOwner) return;
    const value = content.trim();
    if (kind === "edit" && (!value || value.length > 2000)) {
      setError("질문은 공백을 제외한 내용이 있어야 하며 2,000자 이내로 입력해 주세요.");
      return;
    }
    if (
      kind === "delete" &&
      !window.confirm("이 질문을 삭제하시겠습니까? 삭제 후에는 되돌릴 수 없습니다.")
    )
      return;
    lock.current = true;
    setAction(kind);
    setError("");
    try {
      if (kind === "delete") {
        await deleteQuestion(question.id);
        if (active.current) onChanged({ id: question.id, deleted: true });
      } else {
        await updateQuestion(question.id, { title: value.slice(0, 200), content: value });
        if (active.current) {
          onChanged({ id: question.id, content: value });
          setEditing(false);
          editTrigger.current?.focus();
        }
      }
    } catch (requestError) {
      if (active.current)
        setError(
          requestError.response?.data?.message || "질문을 처리하지 못했습니다. 다시 시도해 주세요."
        );
    } finally {
      lock.current = false;
      if (active.current) setAction("");
    }
  }

  return (
    <article className="project-question">
      <div className="project-detail-row">
        <div className="project-detail-meta">
          <span className="project-detail-avatar" aria-hidden="true">
            {question.authorNickname?.slice(0, 1)}
          </span>
          <strong className="project-question-author">{question.authorNickname}</strong>
          {hasLevel && (
            <span
              className={`project-detail-level project-detail-level--${question.authorLevel.toLowerCase()}`}
            >
              {question.authorLevel}
              {Number.isFinite(authorScore) && ` · ${authorScore}점`}
            </span>
          )}
          {time && (
            <time dateTime={time.dateTime} title={`${time.exact} (한국 시간)`}>
              {time.label}
            </time>
          )}
        </div>
        {isOwner && (
          <div className="project-detail-inline">
            <button
              ref={editTrigger}
              className="project-question-button"
              type="button"
              disabled={Boolean(action)}
              onClick={() => {
                setContent(question.content);
                setError("");
                setEditing(!editing);
              }}
            >
              {editing ? "취소" : "수정"}
            </button>
            <button
              className="project-question-button"
              type="button"
              disabled={Boolean(action)}
              onClick={() => mutate("delete")}
            >
              {action === "delete" ? "삭제 중…" : "삭제"}
            </button>
          </div>
        )}
      </div>
      {editing ? (
        <form
          className="project-question-form"
          onSubmit={(event) => {
            event.preventDefault();
            mutate("edit");
          }}
        >
          <label htmlFor={`project-question-edit-${question.id}`}>질문 수정</label>
          <textarea
            ref={editInput}
            id={`project-question-edit-${question.id}`}
            maxLength={2000}
            value={content}
            disabled={Boolean(action)}
            onChange={(event) => setContent(event.target.value)}
          />
          <button
            className="project-question-button project-question-button--primary"
            type="submit"
            disabled={Boolean(action)}
          >
            {action === "edit" ? "저장 중…" : "저장"}
          </button>
        </form>
      ) : (
        <p className="project-question-body">{question.content}</p>
      )}
      {error && (
        <p className="project-detail-error" role="alert">
          {error}
        </p>
      )}
      <div className="project-question-answers">
        <AnswerSection
          questionId={question.id}
          questionAuthorId={question.authorId}
          isSolved={question.isSolved}
          onSolvedChange={(isSolved) => onChanged({ id: question.id, isSolved })}
        />
      </div>
    </article>
  );
}
