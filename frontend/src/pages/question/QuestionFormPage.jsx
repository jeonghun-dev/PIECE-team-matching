import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createQuestion, getQuestion, updateQuestion } from "../../api/questions";
import { useAuth } from "../../hooks/useAuth";
import "./QuestionFormPage.css";

// SCR-12 질문 작성/수정 (정우빈)
export default function QuestionFormPage() {
  const { id } = useParams();
  const { user } = useAuth();
  return <QuestionEditor key={`${id ?? "new"}:${user?.id ?? "guest"}`} id={id} userId={user?.id} />;
}

function QuestionEditor({ id, userId }) {
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [touched, setTouched] = useState({ title: false, content: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const submitLock = useRef(false);
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    return () => { activeRef.current = false; };
  }, []);

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    async function loadQuestion() {
      setLoading(true);
      setLoadError("");
      try {
        const response = await getQuestion(id);
        const data = response.data.data;
        if (ignore) return;
        if (!userId || String(data.authorId) !== String(userId)) {
          setLoadError("질문 작성자만 수정할 수 있습니다.");
          return;
        }
        setTitle(data.title);
        setContent(data.content);
      } catch (requestError) {
        if (!ignore) setLoadError(requestError.response?.data?.message || "기존 질문을 불러오지 못했습니다. 다시 시도해 주세요.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadQuestion();
    return () => { ignore = true; };
  }, [id, userId, retryCount]);

  const titleError = !title.trim()
    ? "제목을 입력해 주세요. 공백만 입력할 수 없습니다."
    : title.trim().length > 200 ? "제목은 200자 이하여야 합니다." : "";
  const contentError = !content.trim()
    ? "내용을 입력해 주세요. 공백만 입력할 수 없습니다."
    : content.trim().length > 2000 ? "내용은 2,000자 이하여야 합니다." : "";

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitLock.current || loading || loadError) return;
    setTouched({ title: true, content: true });
    if (titleError || contentError) {
      (titleError ? titleRef : contentRef).current?.focus();
      return;
    }

    submitLock.current = true;
    setSubmitting(true);
    setError("");
    try {
      const input = { title: title.trim(), content: content.trim() };
      const response = isEditing
        ? await updateQuestion(id, input)
        : await createQuestion(input);
      const data = response.data.data;
      if (activeRef.current) navigate(`/questions/${data.id}`, { replace: true });
    } catch (requestError) {
      if (activeRef.current) setError(requestError.response?.data?.message || "질문을 저장하지 못했습니다. 입력 내용은 유지되어 있으니 다시 시도해 주세요.");
    } finally {
      submitLock.current = false;
      if (activeRef.current) setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="question-form-page"><p role="status">기존 질문을 불러오는 중입니다.</p></div>;
  }

  if (loadError) {
    return (
      <section className="question-form-page">
        <h1>질문 수정</h1>
        <p role="alert">{loadError}</p>
        <div className="question-form-actions">
          <button type="button" onClick={() => setRetryCount((prev) => prev + 1)}>다시 확인</button>
        <Link to={`/questions/${id}`}>질문으로 돌아가기</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="question-form-page">
      <nav className="question-form-breadcrumb" aria-label="현재 위치">
        <Link to="/questions">질문 게시판</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{isEditing ? "질문 수정" : "질문 작성"}</span>
      </nav>

      <form onSubmit={handleSubmit} noValidate>
        <div className="question-form-header">
          <h1>{isEditing ? "질문 수정" : "질문 작성"}</h1>
          <div className="question-form-actions">
            <button type="button" disabled={submitting} onClick={() => navigate(isEditing ? `/questions/${id}` : "/questions")}>취소</button>
            <button type="submit" disabled={submitting}>
              {submitting ? "저장 중…" : isEditing ? "수정하기" : "등록하기"}
            </button>
          </div>
        </div>

        <div className="question-form-card">
          <div className="question-form-field">
            <label htmlFor="question-title">제목 <span aria-hidden="true">*</span></label>
            <input
              ref={titleRef}
              id="question-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
              maxLength={200}
              required
              disabled={submitting}
              aria-invalid={touched.title && Boolean(titleError)}
              aria-describedby={`question-title-help${touched.title && titleError ? " question-title-error" : ""}`}
            />
            <p className="question-form-help" id="question-title-help">질문 내용을 한 줄로 요약해 주세요. {title.length}/200자</p>
            {touched.title && titleError && <p className="question-form-error" id="question-title-error" role="alert">{titleError}</p>}
          </div>

          <div className="question-form-field">
            <label htmlFor="question-content">내용 <span aria-hidden="true">*</span></label>
            <textarea
              ref={contentRef}
              id="question-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, content: true }))}
              maxLength={2000}
              required
              disabled={submitting}
              aria-invalid={touched.content && Boolean(contentError)}
              aria-describedby={`question-content-help${touched.content && contentError ? " question-content-error" : ""}`}
            />
            <p className="question-form-help" id="question-content-help">상황과 시도한 방법을 자세히 적어 주세요. {content.length}/2,000자</p>
            {touched.content && contentError && <p className="question-form-error" id="question-content-error" role="alert">{contentError}</p>}
          </div>

          {error && <p className="question-form-error" role="alert">{error}</p>}
          <p className="question-form-notice">답변이 달린 뒤에도 질문을 수정·삭제할 수 있어요. 가장 도움이 된 답변은 직접 채택해 주세요.</p>
        </div>
      </form>
    </section>
  );
}
