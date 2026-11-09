import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProjects } from "../../api/projects";
import { useAuth } from "../../hooks/useAuth";
import { ACTIVE_TIME_OPTIONS, LEVEL, LEVEL_OPTIONS, PROGRESS_MODE_OPTIONS, PROJECT_STATUS, PROJECT_STATUS_LABEL } from "../../constants";
import "./ProjectListPage.css";

const PAGE_SIZE = 6;
// 기존 모집 작성 폼·LevelPolicy의 구간과 같은 표시용 안내이다.
const LEVEL_SCORE_TEXT = {
  [LEVEL.STARTER]: "0 ~ 2점",
  [LEVEL.BUILDER]: "2.5 ~ 7점",
  [LEVEL.ACHIEVER]: "7.5점 이상"
};

function formatDeadline(value) {
  if (!value) return "마감일 미정";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.slice(5).replace("-", ".");
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "마감일 확인 필요" : new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul", month: "2-digit", day: "2-digit"
  }).formatToParts(date).filter((part) => part.type === "month" || part.type === "day").map((part) => part.value).join(".");
}

// SCR-07 모집 게시판 목록 (정우빈)
export default function ProjectListPage() {
  const { user, loading: authLoading } = useAuth();
  if (authLoading) {
    return <div className="project-list-page"><p role="status">로그인 정보를 확인하고 있습니다.</p></div>;
  }
  const defaultLevel = Object.values(LEVEL).includes(user?.level) ? user.level : "";
  return <ProjectListContent key={user?.id ?? "guest"} defaultLevel={defaultLevel} />;
}

function ProjectListContent({ defaultLevel }) {
  const [projects, setProjects] = useState([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [keywordError, setKeywordError] = useState("");
  const [level, setLevel] = useState(defaultLevel);
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("latest");
  const [statusCounts, setStatusCounts] = useState({ all: 0, open: 0, closed: 0 });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageStart = Math.floor((page - 1) / 5) * 5 + 1;
  const pageEnd = Math.min(pageStart + 4, totalPages);

  useEffect(() => {
    let ignore = false;
    async function fetchProjects() {
      setLoading(true);
      setError("");
      try {
        // 전체 레벨·전체 상태는 빈 문자열 대신 파라미터를 생략한다.
        const filters = { keyword, ...(level ? { level } : {}) };
        const [response, openResponse, closedResponse] = await Promise.all([
          getProjects({ ...filters, page, size: PAGE_SIZE, sort, ...(status ? { status } : {}) }),
          getProjects({ ...filters, page: 1, size: 1, status: PROJECT_STATUS.OPEN }),
          getProjects({ ...filters, page: 1, size: 1, status: PROJECT_STATUS.CLOSED })
        ]);
        if (!ignore) {
          setProjects(response.data.data.items);
          setTotalCount(response.data.data.totalCount);
          const open = openResponse.data.data.totalCount;
          const closed = closedResponse.data.data.totalCount;
          setStatusCounts({ all: open + closed, open, closed });
        }
      } catch {
        if (!ignore) setError("모집 글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchProjects();
    return () => { ignore = true; };
  }, [page, retryCount, keyword, level, status, sort]);

  return (
    <div className="project-list-page project-list-layout">
      <aside className="project-list-sidebar" aria-label="모집 레벨 필터">
        <div className="project-list-card-top">
          <h2>레벨 필터</h2>
          <button type="button" className="project-list-reset" onClick={() => { setLevel(defaultLevel); setPage(1); }}>초기화</button>
        </div>
        <div className="project-list-level-filters">
          {LEVEL_OPTIONS.map((option) => (
            <label className="project-list-level-option" key={option.code}>
              <input
                type="checkbox"
                role="switch"
                checked={level === option.code}
                onChange={() => { setLevel((prev) => prev === option.code ? "" : option.code); setPage(1); }}
              />
              <span className="project-list-level-description">
                <span className={`project-list-level project-list-level--${option.code.toLowerCase()}`}>{option.label}</span>
                <span className="project-list-level-score">{LEVEL_SCORE_TEXT[option.code]}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="project-list-filter-help">
          {defaultLevel ? `내 레벨(${defaultLevel})이 기본으로 켜져 있어요` : "비로그인 상태에서는 전체 레벨을 보여드려요"}
        </p>
      </aside>

      <section className="project-list-content" aria-label="모집 게시판">
      <div className="project-list-header">
        <div>
          <h1>프로젝트 모집 게시판</h1>
          <p>내 레벨에 맞는 프로젝트를 찾아 참여 요청을 보내세요.</p>
        </div>
        <Link className="project-list-write" to="/projects/new">+ 모집 글 작성</Link>
      </div>

      <form className="project-list-search" onSubmit={(event) => {
        event.preventDefault();
        const nextKeyword = keywordInput.trim();
        if (nextKeyword.length > 100) { setKeywordError("검색어는 100자 이내로 입력해 주세요."); return; }
        setKeywordError("");
        setKeyword(nextKeyword);
        setPage(1);
      }}>
        <div className="project-list-search-field">
          <label className="project-list-visually-hidden" htmlFor="project-search">모집 글 검색</label>
          <svg className="project-list-icon project-list-search-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 5 5" />
          </svg>
          <input
            id="project-search"
            type="search"
            placeholder="제목·내용으로 검색하세요"
            maxLength={100}
            value={keywordInput}
            onChange={(event) => { setKeywordInput(event.target.value); setKeywordError(""); }}
            aria-invalid={Boolean(keywordError)}
            aria-describedby={keywordError ? "project-search-hint project-search-error" : "project-search-hint"}
          />
          <span className="project-list-search-hint" id="project-search-hint">제목 · 내용 검색</span>
        </div>
        {keywordError && <p className="project-list-search-error" id="project-search-error" role="alert">{keywordError}</p>}
      </form>

      <div className="project-list-toolbar">
        <div className="project-list-tabs" role="group" aria-label="모집 상태">
          {[
            { value: "", label: "전체", count: statusCounts.all },
            { value: PROJECT_STATUS.OPEN, label: "모집중", count: statusCounts.open },
            { value: PROJECT_STATUS.CLOSED, label: "모집완료", count: statusCounts.closed }
          ].map((tab) => (
            <button key={tab.value} type="button" aria-pressed={status === tab.value} onClick={() => { setStatus(tab.value); setPage(1); }}>
              {tab.label} <span>{loading || error ? "…" : tab.count}</span>
            </button>
          ))}
        </div>
        <div className="project-list-sort">
          {level && <span className="project-list-applied-filter">적용 필터 <span className={`project-list-level project-list-level--${level.toLowerCase()}`}>{level}</span></span>}
          <label className="project-list-visually-hidden" htmlFor="project-sort">정렬</label>
          <select id="project-sort" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
            <option value="latest">최신순</option>
            <option value="views">조회수순</option>
            <option value="questions">질문수순</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="project-list-state" role="status">모집 글을 불러오는 중입니다.</p>
      ) : error ? (
        <div className="project-list-state">
          <p role="alert">{error}</p>
          <button type="button" onClick={() => setRetryCount((prev) => prev + 1)}>다시 시도</button>
        </div>
      ) : projects.length === 0 ? (
        <p className="project-list-state">{keyword || level || status ? "선택한 검색·필터 조건에 맞는 모집 글이 없습니다." : "등록된 모집 글이 없습니다."}</p>
      ) : (
        <>
          <ul className="project-list-grid">
            {projects.map((project) => {
              const memberCount = Number(project.memberCount);
              const capacity = Number(project.capacity);
              const closed = project.status === PROJECT_STATUS.CLOSED;
              const times = Array.isArray(project.activeTimes)
                ? project.activeTimes : (project.activeTimes ?? "").split(",").filter(Boolean);
              const mode = PROGRESS_MODE_OPTIONS.find((option) => option.code === project.progressMode)?.label;
              return (
                <li key={project.id} className={`project-list-card${closed ? " project-list-card--closed" : ""}`}>
                  <div className="project-list-card-top">
                    {Object.values(LEVEL).includes(project.targetLevel) && (
                      <span className={`project-list-level project-list-level--${project.targetLevel.toLowerCase()}`}>{project.targetLevel}</span>
                    )}
                    <span className={`project-list-status${closed ? " project-list-status--closed" : ""}`}>
                      {PROJECT_STATUS_LABEL[project.status] ?? project.status}
                    </span>
                  </div>
                  <h2><Link to={`/projects/${project.id}`}>{project.title}</Link></h2>
                  <div className="project-list-card-meta">
                    <span className="project-list-members">
                      <svg className="project-list-person-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <circle cx="9" cy="7" r="3" />
                        <path d="M3 21v-2a6 6 0 0 1 12 0v2M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v2" />
                      </svg>
                      <span>{memberCount} / {capacity}명</span>
                    </span>
                    <span>마감 {formatDeadline(project.deadline)}</span>
                  </div>
                  <progress
                    className="project-list-progress"
                    value={Math.min(memberCount, capacity)}
                    max={capacity > 0 ? capacity : 1}
                    aria-label={`모집 인원 ${capacity}명 중 ${memberCount}명 참여`}
                  />
                  <div className="project-list-card-meta">
                    <span className="project-list-conditions">
                      <span className="project-list-condition">
                        <svg className="project-list-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {mode ?? "진행 방식 미정"}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="project-list-condition">
                        <svg className="project-list-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 2" />
                        </svg>
                        {times.map((time) => ACTIVE_TIME_OPTIONS.find((option) => option.code === time)?.label ?? time).join(" · ")}
                      </span>
                    </span>
                    <span>조회 {project.viewCount} · 질문 {project.questionCount}</span>
                  </div>
                </li>
              );
            })}
          </ul>
          <nav className="project-list-pagination" aria-label="모집 목록 페이지">
            {pageStart > 1 && <button type="button" onClick={() => setPage(pageStart - 1)}>이전</button>}
            {Array.from({ length: pageEnd - pageStart + 1 }, (_, index) => pageStart + index).map((number) => (
              <button type="button" key={number} aria-label={`${number}페이지`} aria-current={page === number ? "page" : undefined} onClick={() => setPage(number)}>{number}</button>
            ))}
            {pageEnd < totalPages && <button type="button" onClick={() => setPage(pageEnd + 1)}>다음</button>}
          </nav>
        </>
      )}
      </section>
    </div>
  );
}
