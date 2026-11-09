import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteQuestion, getQuestion, reportQuestion } from "../../api/questions";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import { LEVEL } from "../../constants";
import AnswerSection from "../../components/answer/AnswerSection";
import { useAuth } from "../../hooks/useAuth";
import ReportButton from "../../components/report/ReportButton";
import ReportForm from "../../components/report/ReportForm";
import "./QuestionDetailPage.css";

// SCR-13 질문 상세 (정우빈·김정훈)
export default function QuestionDetailPage() {
  const { id } = useParams();
  return <QuestionDetailContent key={id} id={id} />;
}

function QuestionDetailContent({ id }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [canRetry, setCanRetry] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const reportAreaRef = useRef(null);
  const reportTriggerRef = useRef(null);
  const reportSuccessRef = useRef(null);
  const deleteLock = useRef(false);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    return () => { activeRef.current = false; };
  }, []);

  useEffect(() => {
    if (reportOpen) reportAreaRef.current?.querySelector("select")?.focus();
    else if (reportSuccess) reportSuccessRef.current?.focus();
    else reportTriggerRef.current?.querySelector("button")?.focus();
  }, [reportOpen, reportSuccess]);

  async function handleReport(input) {
    await reportQuestion(id, input);
    if (activeRef.current) {
      setReportSuccess(true);
      setReportOpen(false);
    }
  }

  async function handleDelete() {
    if (deleteLock.current || !question || user?.id == null || String(user.id) !== String(question.authorId)) return;
    if (!window.confirm("이 질문을 삭제하시겠습니까? 삭제하면 목록에서 보이지 않으며 되돌릴 수 없습니다.")) return;

    deleteLock.current = true;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteQuestion(question.id);
      if (activeRef.current) navigate("/questions", { replace: true });
    } catch (requestError) {
      if (activeRef.current) {
        setDeleteError(requestError.response?.data?.message || "질문을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      deleteLock.current = false;
      if (activeRef.current) setDeleting(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function fetchQuestion() {
      setLoading(true);
      setError("");

      try {
        const data = await getQuestion(id);

        if (!ignore) {
          setQuestion(data);
        }
      } catch (requestError) {
        if (!ignore) {
          const status = requestError.response?.status;
          const retryable = !status || status >= 500 || status === 429;
          setCanRetry(retryable);
          setError(
            status === 404
              ? "질문을 찾을 수 없거나 삭제되었습니다. 질문 목록에서 다른 글을 선택해 주세요."
              : status === 400
                ? "질문 주소가 올바르지 않습니다. 질문 목록에서 다시 선택해 주세요."
                : status === 403
                  ? "질문을 조회할 권한이 없습니다. 질문 목록으로 돌아가 주세요."
                  : retryable
                    ? "질문을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
                    : "질문을 불러올 수 없습니다. 질문 목록으로 돌아가 다시 확인해 주세요."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchQuestion();

    return () => {
      ignore = true;
    };
  }, [id, retryCount]);

  if (loading) {
    return <div className="question-detail-page"><p role="status">질문을 불러오는 중입니다.</p></div>;
  }

  if (error) {
    return (
      <div className="question-detail-page">
        <div className="question-detail-card">
          <p role="alert">{error}</p>
          <div className="question-detail-actions">
            {canRetry && (
              <button type="button" onClick={() => setRetryCount((prev) => prev + 1)}>
                다시 시도
              </button>
            )}
            <Link to="/questions">질문 목록으로</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return <p>질문 정보가 없습니다.</p>;
  }

  const createdTime = formatRelativeTime(question.createdAt);
  const hasLevel = Object.values(LEVEL).includes(question.authorLevel);
  const authorScore = question.authorScore == null ? null : Number(question.authorScore);

  return (
      <section className="question-detail-page">
        <nav className="question-detail-breadcrumb" aria-label="현재 위치">
          <Link to="/questions">질문 게시판</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">질문 상세</span>
        </nav>
        <article className="question-detail-card">
          <div className="question-detail-topline">
            <span className={`question-detail-status${question.isSolved ? " question-detail-status--solved" : ""}`}>
              {question.isSolved ? "해결됨" : "미해결"}
            </span>
            <div className="question-detail-meta">
              {user?.id != null && String(user.id) !== String(question.authorId) && (
                <span ref={reportTriggerRef}>
                  <ReportButton
                    disabled={reportOpen || reportSuccess}
                    onClick={() => setReportOpen(true)}
                  />
                </span>
              )}
              <span>조회 {question.viewCount}</span>
              {createdTime && (
                <time
                  dateTime={createdTime.dateTime}
                  title={`${createdTime.exact} (한국 시간)`}
                >
                  {createdTime.label}
                </time>
              )}
            </div>
          </div>

          <h1>{question.title}</h1>
          <div className="question-detail-author">
            <span className="question-detail-avatar" aria-hidden="true">
              {question.authorNickname?.slice(0, 1)}
            </span>
            <span className="question-detail-nickname">{question.authorNickname}</span>
            {hasLevel && (
              <span className={`question-detail-level question-detail-level--${question.authorLevel.toLowerCase()}`}>
                {question.authorLevel}
                {Number.isFinite(authorScore) && ` · ${authorScore}점`}
              </span>
            )}
          </div>
          {user?.id != null && String(user.id) === String(question.authorId) && (
            <div className="question-detail-actions">
              {!deleting && <Link to={`/questions/${question.id}/edit`}>수정</Link>}
              <button
                type="button"
                className="question-detail-delete"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? "삭제 중…" : "삭제"}
              </button>
            </div>
          )}
          {deleteError && <p className="question-detail-delete-error" role="alert">{deleteError}</p>}
          <div className="question-detail-body">
            {question.content}
          </div>
          {reportSuccess && <p ref={reportSuccessRef} className="question-detail-report-success" role="status" tabIndex={-1}>신고가 접수되었습니다.</p>}
        </article>
        {reportOpen && user?.id != null && String(user.id) !== String(question.authorId) && (
          <div className="question-detail-report" ref={reportAreaRef}>
            <ReportForm
              key={`${id}:${user.id}`}
              onSubmit={handleReport}
              onCancel={() => {
                setReportOpen(false);
              }}
            />
          </div>
        )}
        <section className="question-detail-card question-detail-answers" aria-label="질문 답변">
          <AnswerSection
            key={question.id}
            questionId={question.id}
            questionAuthorId={question.authorId}
            isSolved={question.isSolved}
            onSolvedChange={(isSolved) => {
              setQuestion((prev) => (prev ? { ...prev, isSolved } : prev));
            }}
          />
        </section>
      </section>
  );
}
