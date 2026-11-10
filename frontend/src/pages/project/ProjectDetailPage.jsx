import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteProject, getProject } from "../../api/projects";
import { getMember } from "../../api/members";
import { applyToProject, getProjectMembers } from "../../api/projectDetail";
import { useAuth } from "../../hooks/useAuth";
import ProjectApplyButton from "../../components/project/ProjectApplyButton";
import ProjectQuestionSection from "./ProjectQuestionSection";
import ProjectReportArea from "./ProjectReportArea";
import {
  ACTIVE_TIME_OPTIONS,
  LEVEL,
  PROGRESS_MODE_OPTIONS,
  PROJECT_STATUS,
  PROJECT_STATUS_LABEL
} from "../../constants";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import "./ProjectDetailPage.css";

function LevelBadge({ level }) {
  if (!Object.values(LEVEL).includes(level)) return null;
  return (
    <span className={`project-detail-level project-detail-level--${level.toLowerCase()}`}>
      {level}
    </span>
  );
}

// SCR-09 모집 글 상세 (정우빈)
export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  return <ProjectDetailContent key={`${id}:${user?.id}`} id={id} user={user} />;
}

function ProjectDetailContent({ id, user }) {
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [extraError, setExtraError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [action, setAction] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [reportTarget, setReportTarget] = useState(null);
  const actionLock = useRef(false);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  async function handleApply() {
    if (
      actionLock.current ||
      !project ||
      !user ||
      project.isMember ||
      project.hasApplied ||
      project.status !== PROJECT_STATUS.OPEN ||
      String(user.id) === String(project.authorId)
    )
      return;
    actionLock.current = true;
    setAction("apply");
    setActionError("");
    setActionSuccess("");
    try {
      await applyToProject(id);
      if (active.current) {
        setProject((prev) => ({
          ...prev,
          hasApplied: true,
          pendingCount: Number(prev.pendingCount) + 1
        }));
        setActionSuccess("참여 요청을 보냈습니다. 요청함에서 확인할 수 있습니다.");
      }
    } catch (requestError) {
      if (active.current)
        setActionError(
          requestError.response?.data?.message ||
          "참여 요청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요."
        );
    } finally {
      actionLock.current = false;
      if (active.current) setAction("");
    }
  }

  async function handleDelete() {
    if (actionLock.current || !project || !user || String(user.id) !== String(project.authorId))
      return;
    if (!window.confirm("모집 글을 삭제하시겠습니까? 삭제 후에는 되돌릴 수 없습니다.")) return;
    actionLock.current = true;
    setAction("delete");
    setActionError("");
    try {
      await deleteProject(id);
      if (active.current) navigate("/projects", { replace: true });
    } catch (requestError) {
      if (active.current)
        setActionError(
          requestError.response?.data?.message ||
          "모집 글을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요."
        );
    } finally {
      actionLock.current = false;
      if (active.current) setAction("");
    }
  }

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError("");
      setExtraError("");
      setMembers([]);
      setAuthor(null);
      try {
        const response = await getProject(id);
        const data = response.data.data;
        const results = await Promise.allSettled([getProjectMembers(id), getMember(data.authorId)]);
        if (ignore) return;
        setProject(data);
        if (results[0].status === "fulfilled") setMembers(results[0].value.data.data);
        if (results[1].status === "fulfilled") setAuthor(results[1].value.data.data);
        if (results[0].status === "rejected") {
          setExtraError("팀원 정보를 불러오지 못했습니다. 다시 시도해 주세요.");
        }
      } catch (requestError) {
        if (!ignore)
          setError(
            requestError.response?.status === 404
              ? "모집 글을 찾을 수 없거나 삭제되었습니다."
              : "모집 글을 불러오지 못했습니다. 다시 시도해 주세요."
          );
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [id, retryCount]);

  if (loading)
    return (
      <div className="project-detail-page">
        <p role="status">모집 글을 불러오는 중입니다.</p>
      </div>
    );
  if (error || !project)
    return (
      <div className="project-detail-page">
        <div className="project-detail-panel">
          <p role="alert">{error || "모집 글 정보가 없습니다."}</p>
          <button type="button" onClick={() => setRetryCount((prev) => prev + 1)}>
            다시 시도
          </button>{" "}
          <Link to="/projects">모집 게시판으로</Link>
        </div>
      </div>
    );

  const closed = project.status === PROJECT_STATUS.CLOSED;
  const isOwner = user?.id != null && String(user.id) === String(project.authorId);
  const applyStatus = project.isMember
    ? "MEMBER"
    : closed
      ? "CLOSED"
      : project.hasApplied
        ? "APPLIED"
        : "AVAILABLE";
  const times = Array.isArray(project.activeTimes)
    ? project.activeTimes
    : (project.activeTimes ?? "").split(",").filter(Boolean);
  const mode = PROGRESS_MODE_OPTIONS.find((option) => option.code === project.progressMode)?.label;
  const authorMember = members.find((member) => String(member.userId) === String(project.authorId));
  const authorName = author?.nickname ?? authorMember?.nickname ?? "작성자";
  const createdTime = formatRelativeTime(project.createdAt);
  const createdDate = createdTime
    ? new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
      .formatToParts(new Date(createdTime.dateTime))
      .filter((part) => ["year", "month", "day"].includes(part.type))
      .map((part) => part.value)
      .join(".")
    : "";
  const deadline = project.deadline ? new Date(project.deadline) : null;
  const deadlineText =
    deadline && !Number.isNaN(deadline.getTime())
      ? new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(deadline)
      : "미정";
  const dDay =
    project.dDay == null
      ? ""
      : Number(project.dDay) > 0
        ? `D-${project.dDay}`
        : Number(project.dDay) === 0
          ? "D-Day"
          : "마감";

  return (
    <section className="project-detail-page">
      <nav className="project-detail-breadcrumb" aria-label="현재 위치">
        <Link to="/projects">모집 게시판</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">모집 글 상세</span>
      </nav>
      {extraError && (
        <div className="project-detail-panel">
          <p role="alert">{extraError}</p>
          <button type="button" onClick={() => setRetryCount((prev) => prev + 1)}>
            다시 시도
          </button>
        </div>
      )}
      <div className="project-detail-layout">
        <div className="project-detail-main">
          <article className="project-detail-panel">
            <div className="project-detail-row">
              <div className="project-detail-inline">
                <LevelBadge level={project.targetLevel} />
                <span
                  className={`project-detail-status${closed ? " project-detail-status--closed" : ""}`}
                >
                  {PROJECT_STATUS_LABEL[project.status]}
                </span>
              </div>
              <div className="project-detail-meta">
                {!isOwner && <ProjectReportArea projectId={id} formTarget={reportTarget} />}
                <span>조회 {project.viewCount}</span>
                {createdTime && (
                  <time dateTime={createdTime.dateTime} title={`${createdTime.exact} (한국 시간)`}>
                    {createdDate}
                  </time>
                )}
              </div>
            </div>
            <h1>{project.title}</h1>
            <div className="project-detail-inline">
              <span className="project-detail-avatar" aria-hidden="true">
                {authorName.slice(0, 1)}
              </span>
              <strong>{authorName}</strong>
              <LevelBadge level={author?.learning?.level ?? authorMember?.level} />
              {author?.learning?.totalScore != null && (
                <span className="project-detail-muted">{Number(author.learning.totalScore)}점</span>
              )}
            </div>
            <dl className="project-detail-summary">
              <div>
                <dt>모집 인원</dt>
                <dd>
                  {project.memberCount} / {project.capacity}명
                </dd>
              </div>
              <div>
                <dt>진행 방식</dt>
                <dd>{mode ?? "미정"}</dd>
              </div>
              <div>
                <dt>주요 활동 시간</dt>
                <dd>
                  {times
                    .map(
                      (time) =>
                        ACTIVE_TIME_OPTIONS.find((option) => option.code === time)?.label ?? time
                    )
                    .join(" · ") || "미정"}
                </dd>
              </div>
              <div>
                <dt>모집 마감</dt>
                <dd>
                  {deadlineText} {dDay && `(${dDay})`}
                </dd>
              </div>
            </dl>
            <div className="project-detail-body">
              <h2>① 프로젝트 명</h2>
              <p>{project.title}</p>
              <h2>② 프로젝트 소개</h2>
              <p>{project.content}</p>
              <h2>③ 회의 진행 및 모임 방식</h2>
              <p>{project.meetingMethod}</p>
            </div>
            {!isOwner && <div ref={setReportTarget} />}
          </article>
          <ProjectQuestionSection projectId={id} user={user} />
        </div>
        <aside className="project-detail-sidebar" aria-label="모집 현황과 관리">
          <section className="project-detail-panel" aria-label="모집 현황">
            <div className="project-detail-row">
              <h2>모집 현황</h2>
              <strong className="project-detail-count">
                {project.memberCount} / {project.capacity}명
              </strong>
            </div>
            <progress
              max={Math.max(1, Number(project.capacity))}
              value={Math.min(Number(project.memberCount), Number(project.capacity))}
              aria-label={`정원 ${project.capacity}명 중 ${project.memberCount}명 참여`}
            />
            <ul className="project-detail-members">
              {members.map((member) => (
                <li key={member.userId}>
                  <span className="project-detail-avatar" aria-hidden="true">
                    {member.nickname?.slice(0, 1)}
                  </span>
                  <span>
                    {member.nickname} <small>{member.role === "LEADER" ? "모집자" : "팀원"}</small>
                  </span>
                  <LevelBadge level={member.level} />
                </li>
              ))}
            </ul>
            {Number(project.capacity) > Number(project.memberCount) && (
              <p className="project-detail-muted">
                빈 자리 {Number(project.capacity) - Number(project.memberCount)}
              </p>
            )}
            <p className="project-detail-muted">대기 중인 참여 요청 {project.pendingCount}명</p>
            {!isOwner && (
              <>
                <fieldset
                  className="project-detail-apply"
                  disabled={action === "apply"}
                  aria-busy={action === "apply"}
                >
                  <legend className="project-detail-visually-hidden">프로젝트 참여 요청</legend>
                  <ProjectApplyButton status={applyStatus} onApply={handleApply} />
                </fieldset>
                {action === "apply" && <p role="status">참여 요청을 보내는 중입니다.</p>}
                {actionSuccess && (
                  <p className="project-detail-note" role="status">
                    {actionSuccess}
                  </p>
                )}
              </>
            )}
          </section>
          {isOwner && (
            <section
              className="project-detail-panel project-detail-actions"
              aria-label="모집자 전용 관리"
            >
              <p className="project-detail-muted">모집자 전용</p>
              {!closed && !action && <Link to={`/projects/${id}/edit`}>모집 글 수정</Link>}
              {closed && (
                <p className="project-detail-muted">모집완료된 글은 수정할 수 없습니다.</p>
              )}
              {!action && <Link to={`/projects/${id}/manage`}>지원자 · 팀원 관리</Link>}
              <button
                type="button"
                className="project-detail-danger"
                disabled={Boolean(action)}
                onClick={handleDelete}
              >
                {action === "delete" ? "삭제 중…" : "모집 글 삭제"}
              </button>
            </section>
          )}
          {actionError && (
            <div className="project-detail-panel">
              <p className="project-detail-error" role="alert">
                {actionError}
              </p>
              <button
                type="button"
                onClick={() => {
                  setActionError("");
                  setRetryCount((prev) => prev + 1);
                }}
              >
                최신 상태 확인
              </button>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
