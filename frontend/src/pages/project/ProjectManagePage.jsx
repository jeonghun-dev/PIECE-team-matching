// SCR-10 지원자·팀원 관리 (김정훈)
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteProject, getProject } from "../../api/projects";
import { getProjectMembers } from "../../api/projectDetail";
import {
  getProjectApplicants,
  removeProjectMember,
} from "../../api/projectManage";
import {
  acceptRequest,
  notifyRequestsUpdated,
  rejectRequest,
} from "../../api/requests";
import { useAuth } from "../../hooks/useAuth";
import {
  ACTIVE_TIME_OPTIONS,
  CERTIFICATE_OPTIONS,
  COLLABORATION_OPTIONS,
  PROJECT_STATUS,
  PROJECT_STATUS_LABEL,
} from "../../constants";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import { findLabel, formatDDay } from "../../utils/format";
import LevelBadge from "../../components/common/LevelBadge";
import "./ProjectManagePage.css";

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

// 주요 이력: 자격증 + 수상 + 프로젝트
const historyText = (applicant) => {
  const items = applicant.certificates.map((code) =>
    findLabel(CERTIFICATE_OPTIONS, code),
  );
  if (applicant.awardCount > 0) items.push(`수상 ${applicant.awardCount}`);
  if (applicant.projectCount > 0)
    items.push(`프로젝트 ${applicant.projectCount}`);
  return items.length > 0 ? items.join(" · ") : "-";
};

// 협업 방식: 온라인 · 평일 저녁
const collaborationText = (applicant) => {
  const mode = findLabel(COLLABORATION_OPTIONS, applicant.collaborationMode);
  const times = applicant.activeTimes.map((code) =>
    findLabel(ACTIVE_TIME_OPTIONS, code),
  );
  return [mode, ...times].join(" · ");
};

function Avatar({ name }) {
  return (
    <span className="project-manage-avatar" aria-hidden="true">
      {name?.slice(0, 1)}
    </span>
  );
}

// 주소의 모집 글 번호가 바뀌면 key로 화면을 새로 만들어 이전 글의 상태·응답이 섞이지 않게 함
export default function ProjectManagePage() {
  const { id } = useParams();
  return <ProjectManageContent key={id} id={id} />;
}

function ProjectManageContent({ id }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  // 화면이 아직 떠 있는지 (응답이 늦게 와도 떠난 화면에서는 이동·상태 변경 안 함)
  const active = useRef(true);

  const [project, setProject] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [actionKey, setActionKey] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  // 모집 글 → (모집자면) 지원자·팀원 함께 불러오기
  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const projectResponse = await getProject(id);
        const data = projectResponse.data.data;

        if (String(data.authorId) !== String(user?.id)) {
          if (!ignore) setError("모집자만 지원자·팀원을 관리할 수 있어요.");
          return;
        }

        const [applicantResponse, memberResponse] = await Promise.all([
          getProjectApplicants(id),
          getProjectMembers(id),
        ]);

        if (!ignore) {
          setProject(data);
          setApplicants(applicantResponse.data.data);
          setMembers(memberResponse.data.data);
        }
      } catch (requestError) {
        if (!ignore) {
          setError(
            requestError.response?.status === 404
              ? "모집 글을 찾을 수 없거나 삭제되었습니다."
              : getErrorMessage(
                  requestError,
                  "정보를 불러오지 못했습니다. 다시 시도해 주세요.",
                ),
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [id, user?.id, reloadKey]);

  const reload = () => setReloadKey((key) => key + 1);

  // 수락·거절·제외 공통: 확인창 → API → 다시 불러오기
  const runAction = async (key, message, request, fallback) => {
    if (actionKey || !window.confirm(message)) {
      return;
    }

    setActionKey(key);
    setActionError("");

    try {
      await request();
      notifyRequestsUpdated();
      if (active.current) reload();
    } catch (requestError) {
      if (active.current) {
        setActionError(getErrorMessage(requestError, fallback));
        reload();
      }
    } finally {
      if (active.current) setActionKey(null);
    }
  };

  const handleAccept = (applicant) =>
    runAction(
      `accept-${applicant.requestId}`,
      `'${applicant.nickname}'님의 참여 요청을 수락할까요?\n수락하면 바로 팀원으로 추가됩니다.`,
      () => acceptRequest(applicant.requestId),
      "참여 요청을 수락하지 못했습니다.",
    );

  const handleReject = (applicant) =>
    runAction(
      `reject-${applicant.requestId}`,
      `'${applicant.nickname}'님의 참여 요청을 거절할까요?`,
      () => rejectRequest(applicant.requestId),
      "참여 요청을 거절하지 못했습니다.",
    );

  const handleRemove = (member) =>
    runAction(
      `remove-${member.userId}`,
      `'${member.nickname}'님을 팀에서 제외할까요?`,
      () => removeProjectMember(id, member.userId),
      "팀원을 제외하지 못했습니다.",
    );

  // 모집 글 삭제 후 모집 게시판으로
  const handleDelete = async () => {
    if (
      actionKey ||
      !window.confirm("모집 글을 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.")
    ) {
      return;
    }

    setActionKey("delete");
    setActionError("");

    try {
      await deleteProject(id);
      // 응답을 기다리는 동안 다른 화면으로 떠났으면 이동하지 않음
      if (active.current) navigate("/projects", { replace: true });
    } catch (requestError) {
      if (active.current) {
        setActionError(
          getErrorMessage(requestError, "모집 글을 삭제하지 못했습니다."),
        );
        setActionKey(null);
      }
    }
  };

  if (loading) {
    return (
      <main className="project-manage">
        <p role="status">불러오는 중입니다…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="project-manage">
        <section className="project-manage-card project-manage-message">
          <p role="alert">{error}</p>
          <div className="project-manage-inline">
            <Link to={`/projects/${id}`} className="project-manage-button">
              모집 글로 돌아가기
            </Link>
            <button
              type="button"
              className="project-manage-button"
              onClick={reload}
            >
              다시 시도
            </button>
          </div>
        </section>
      </main>
    );
  }

  const isOpen =
    project.status === PROJECT_STATUS.OPEN && Number(project.dDay) >= 0;
  const isFull = Number(project.memberCount) >= Number(project.capacity);
  const canAccept = isOpen && !isFull;

  return (
    <main className="project-manage">
      <nav className="project-manage-breadcrumb" aria-label="현재 위치">
        <Link to="/projects">모집 게시판</Link>
        <span aria-hidden="true">›</span>
        <Link to={`/projects/${id}`}>모집 글 상세</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">지원자 · 팀원 관리</span>
      </nav>

      <header className="project-manage-head">
        <div>
          <h1>지원자 · 팀원 관리</h1>
          <p className="project-manage-muted">{project.title}</p>
        </div>
        <div className="project-manage-inline">
          <LevelBadge level={project.targetLevel} />
          <span
            className={
              isOpen
                ? "project-manage-status"
                : "project-manage-status project-manage-status--closed"
            }
          >
            {PROJECT_STATUS_LABEL[project.status]}
          </span>
        </div>
      </header>

      <dl className="project-manage-stats">
        <div className="project-manage-card">
          <dt>정원</dt>
          <dd>{project.capacity}명</dd>
        </div>
        <div className="project-manage-card">
          <dt>현재 팀원</dt>
          <dd className="project-manage-stat--primary">
            {project.memberCount}명
          </dd>
        </div>
        <div className="project-manage-card">
          <dt>대기 중인 지원</dt>
          <dd className="project-manage-stat--warning">
            {applicants.length}명
          </dd>
        </div>
        <div className="project-manage-card">
          <dt>모집 마감</dt>
          <dd>{formatDDay(project.dDay)}</dd>
        </div>
      </dl>

      {actionError && (
        <p className="project-manage-error" role="alert">
          {actionError}
        </p>
      )}

      <div className="project-manage-layout">
        <section
          className="project-manage-card"
          aria-labelledby="applicants-title"
        >
          <div className="project-manage-card__head">
            <h2 id="applicants-title">받은 참여 요청</h2>
            <span className="project-manage-muted">
              {canAccept
                ? "수락 시 현재 팀 인원에 추가돼요"
                : isFull
                  ? "정원이 모두 찼어요"
                  : "모집이 끝나 수락할 수 없어요"}
            </span>
          </div>

          {applicants.length === 0 ? (
            <p className="project-manage-empty">
              대기 중인 참여 요청이 없습니다.
            </p>
          ) : (
            <div className="project-manage-table__wrap">
              <table className="project-manage-table">
                <thead>
                  <tr>
                    <th scope="col">지원자</th>
                    <th scope="col">레벨 · 점수</th>
                    <th scope="col">주요 이력</th>
                    <th scope="col">협업 방식</th>
                    <th scope="col">
                      <span className="project-manage-visually-hidden">
                        관리
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((applicant) => {
                    const time = formatRelativeTime(applicant.createdAt);

                    return (
                      <tr key={applicant.requestId}>
                        <td>
                          <div className="project-manage-person">
                            <Avatar name={applicant.nickname} />
                            <div>
                              <strong>{applicant.nickname}</strong>
                              {time && (
                                <time
                                  className="project-manage-time"
                                  dateTime={time.dateTime}
                                  title={time.exact}
                                >
                                  {time.label}
                                </time>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <LevelBadge
                            level={applicant.level}
                            score={applicant.totalScore}
                            soft
                          />
                        </td>
                        <td className="project-manage-small">
                          {historyText(applicant)}
                        </td>
                        <td className="project-manage-small">
                          {collaborationText(applicant)}
                        </td>
                        <td>
                          <div className="project-manage-actions">
                            <Link
                              to={`/members/${applicant.userId}`}
                              className="project-manage-button"
                            >
                              프로필
                            </Link>
                            <button
                              type="button"
                              className="project-manage-button project-manage-button--success"
                              disabled={actionKey !== null || !canAccept}
                              onClick={() => handleAccept(applicant)}
                            >
                              수락
                            </button>
                            <button
                              type="button"
                              className="project-manage-button project-manage-button--danger"
                              disabled={actionKey !== null}
                              onClick={() => handleReject(applicant)}
                            >
                              거절
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="project-manage-side">
          <section
            className="project-manage-card"
            aria-labelledby="members-title"
          >
            <div className="project-manage-card__head">
              <h2 id="members-title">현재 팀원</h2>
              <strong className="project-manage-stat--primary">
                {project.memberCount} / {project.capacity}
              </strong>
            </div>

            <ul className="project-manage-members">
              {members.map((member) => (
                <li key={member.userId}>
                  <Avatar name={member.nickname} />
                  <strong>{member.nickname}</strong>
                  {member.role === "LEADER" && (
                    <span className="project-manage-tag">모집자</span>
                  )}
                  <LevelBadge level={member.level} />
                  {member.role !== "LEADER" && (
                    <button
                      type="button"
                      className="project-manage-button project-manage-button--danger project-manage-members__remove"
                      disabled={actionKey !== null || !isOpen}
                      onClick={() => handleRemove(member)}
                    >
                      팀에서 제외
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <p className="project-manage-notice">
              모집 중에만 팀원을 제외할 수 있어요. 모집완료 시 팀 구성이
              동결되어 변경할 수 없습니다.
            </p>
          </section>

          <section
            className="project-manage-card"
            aria-labelledby="project-admin-title"
          >
            <h2 id="project-admin-title">모집 글 관리</h2>
            <p className="project-manage-muted">
              인원 부족이나 프로젝트 폐기로 진행이 어렵다면 모집 글을 삭제할 수
              있어요.
            </p>
            <div className="project-manage-buttons">
              {isOpen ? (
                <Link
                  to={`/projects/${id}/edit`}
                  className="project-manage-button"
                >
                  모집 글 수정
                </Link>
              ) : (
                <button
                  type="button"
                  className="project-manage-button"
                  disabled
                >
                  모집 글 수정
                </button>
              )}
              <button
                type="button"
                className="project-manage-button project-manage-button--danger"
                disabled={actionKey !== null}
                onClick={handleDelete}
              >
                {actionKey === "delete" ? "삭제 중…" : "모집 글 삭제"}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
