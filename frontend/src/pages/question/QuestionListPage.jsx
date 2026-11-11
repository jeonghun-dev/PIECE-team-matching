import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getQuestions } from "../../api/questions";
import "./QuestionListPage.css";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import { useAuth } from "../../hooks/useAuth";
import { LEVEL, USER_ROLE } from "../../constants";

// SCR-11 질문 게시판 목록 (정우빈)
export default function QuestionListPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === USER_ROLE.ADMIN;
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // 검색창에 입력 중인 값
  const [keywordInput, setKeywordInput] = useState("");
  const [keywordError, setKeywordError] = useState("");

  // 검색 버튼을 눌렀을 때 적용할 값
  const [keyword, setKeyword] = useState("");

  const [sort, setSort] = useState("latest");
  const [status, setStatus] = useState("");

  // 현재 페이지
  const [page, setPage] = useState(1);

  // 검색 조건에 맞는 전체 질문 수
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState({ all: 0, solved: 0, unsolved: 0 });
  const totalPages = Math.max(1, Math.ceil(totalCount / 10));
  const pageGroupStart = Math.floor((page - 1) / 5) * 5 + 1;
  const pageGroupEnd = Math.min(pageGroupStart + 4, totalPages);

  // 화면에 들어오면 질문 목록을 불러온다.
  useEffect(() => {
    let ignore = false;

    async function fetchQuestions() {
      setLoading(true);
      setError("");

      try {
        // totalCount는 페이지 크기와 무관한 전체 개수이다.
        const [response, solvedResponse, unsolvedResponse] = await Promise.all([
          getQuestions({ page, size: 10, sort, keyword, status }),
          getQuestions({ page: 1, size: 1, keyword, status: "solved" }),
          getQuestions({ page: 1, size: 1, keyword, status: "unsolved" })
        ]);
        const data = response.data.data;
        const solvedData = solvedResponse.data.data;
        const unsolvedData = unsolvedResponse.data.data;

        if (!ignore) {
          setQuestions(data.items);
          setTotalCount(data.totalCount);
          setStatusCounts({
            all: solvedData.totalCount + unsolvedData.totalCount,
            solved: solvedData.totalCount,
            unsolved: unsolvedData.totalCount
          });
        }
      } catch {
        if (!ignore) {
          setError("질문 목록을 불러오지 못했습니다.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchQuestions();

    return () => {
      ignore = true;
    };
  }, [retryCount, keyword, sort, status, page]);

  if (loading) {
    return <p role="status">질문 목록을 불러오는 중입니다.</p>;
  }

  if (error) {
    return (
      <div className="question-list-error">
        <p role="alert">{error}</p>
        <button
          type="button"
          onClick={() => setRetryCount((prev) => prev + 1)}
        >
          다시 시도
        </button>
      </div>
    );
  }




  return (
    <section className="question-list-page">
      <div className="question-list-header">
        <div>
          <h1>질문 게시판</h1>
          <p className="question-list-description">
            공부하다 막힌 부분을 질문하고 함께 해결해요
          </p>
        </div>
        {!isAdmin && (
          <Link to="/questions/new" className="question-list-write">
            + 질문 작성
          </Link>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const trimmedKeyword = keywordInput.trim();
          if (trimmedKeyword.length > 100) {
            setKeywordError("검색어는 100자 이내로 입력해 주세요.");
            return;
          }
          setKeywordError("");
          setKeyword(trimmedKeyword);
          setPage(1);
        }}
      >
        <div className="question-list-search-field">
          <label htmlFor="question-search">질문 검색</label>
          <input
            id="question-search"
            type="search"
            placeholder="제목·내용으로 검색하세요"
            value={keywordInput}
            maxLength={100}
            aria-invalid={Boolean(keywordError)}
            aria-describedby={`question-search-help${keywordError ? " question-search-error" : ""}`}
            onChange={(event) => {
              setKeywordInput(event.target.value);
              setKeywordError(event.target.value.trim().length > 100 ? "검색어는 100자 이내로 입력해 주세요." : "");
            }}
          />
        </div>
        <button type="submit">검색</button>
        <p className="question-list-search-help" id="question-search-help">검색어는 최대 100자까지 입력할 수 있습니다.</p>
        {keywordError && <p className="question-list-search-error" id="question-search-error" role="alert">{keywordError}</p>}
      </form>

      <div className="question-list-toolbar">
        <div className="question-list-filters" role="group" aria-label="질문 해결 상태">
          {[
            { value: "", label: "전체", count: statusCounts.all },
            { value: "solved", label: "해결됨", count: statusCounts.solved },
            { value: "unsolved", label: "미해결", count: statusCounts.unsolved }
          ].map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={status === filter.value}
              onClick={() => {
                setStatus(filter.value);
                setPage(1);
              }}
            >
              {filter.label}{" "}
              <span className="question-list-filter-count">{filter.count}</span>
            </button>
          ))}
        </div>

        <div className="question-list-sort" role="group" aria-label="질문 정렬">
          {[
            { value: "latest", label: "최신순" },
            { value: "views", label: "조회수순" },
            { value: "answers", label: "답변수순" }
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={sort === option.value}
              onClick={() => {
                setSort(option.value);
                setPage(1);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>



      {questions.length === 0 ? (
        <p className="question-list-empty">
          {keyword
            ? `"${keyword}"에 대한${status === "solved" ? " 해결된" : status === "unsolved" ? " 미해결" : ""} 질문 검색 결과가 없습니다.`
            : status
              ? `현재 ${status === "solved" ? "해결된" : "미해결"} 질문이 없습니다.`
              : "등록된 질문이 없습니다."}
        </p>
      ) : (
        <ul className="question-list">
          {questions.map((question) => {
            const createdTime = formatRelativeTime(question.createdAt);
            return (
              <li key={question.id} className="question-list-item question-list-row">
                <div className={`question-list-answer-count${question.isSolved ? " question-list-answer-count--solved" : ""}`}>
                  <strong>{question.answerCount}</strong>
                  <span>답변</span>
                </div>
                <div className="question-list-content">
                  <div className="question-list-title-row">
                    <span className={`question-list-status${question.isSolved ? " question-list-status--solved" : ""}`}>
                      {question.isSolved ? "해결됨" : "미해결"}
                    </span>
                    <h2>
                      <Link to={`/questions/${question.id}`}>
                        {question.title}
                      </Link>
                    </h2>
                  </div>
                  <p className="question-list-preview">{question.contentPreview}</p>
                  <div className="question-list-meta">
                    <span className="question-list-author">{question.authorNickname}</span>
                    {Object.values(LEVEL).includes(question.authorLevel) && (
                      <span className={`question-list-level question-list-level--${question.authorLevel.toLowerCase()}`} aria-label={`작성자 레벨 ${question.authorLevel}`}>
                        {question.authorLevel}
                      </span>
                    )}
                    {createdTime && (
                      <>
                        <span aria-hidden="true">·</span>
                        <time
                          dateTime={createdTime.dateTime}
                          title={`${createdTime.exact} (한국 시간)`}
                          aria-label={`${createdTime.label}, 작성 시각 ${createdTime.exact} 한국 시간`}
                        >
                          {createdTime.label}
                        </time>
                      </>
                    )}
                    <span>· 조회 {question.viewCount}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <nav aria-label="질문 목록 페이지">
        {pageGroupStart > 1 && <button
          type="button"
          aria-label="이전 페이지 묶음"
          onClick={() => setPage(pageGroupStart - 1)}
        >
          이전
        </button>}

        {Array.from({ length: pageGroupEnd - pageGroupStart + 1 }, (_, index) => {
          const pageNumber = pageGroupStart + index;
          return (
            <button
              key={pageNumber}
              type="button"
              aria-label={`${pageNumber}페이지`}
              aria-current={page === pageNumber ? "page" : undefined}
              onClick={() => setPage(pageNumber)}
            >
              {pageNumber}
            </button>
          );
        })}

        {pageGroupEnd < totalPages && <button
          type="button"
          aria-label="다음 페이지 묶음"
          onClick={() => setPage(pageGroupEnd + 1)}
        >
          다음
        </button>}
      </nav>

    </section>
  );
}
