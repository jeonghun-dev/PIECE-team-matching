// 마이페이지 
// 참여 중인 팀 / 내 모집 글 관리 / 최근 작성한 질문 / 최근 작성한 답변
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getMyTeams, getMyProjects, getMyQuestions, getMyAnswers } from "../../api/mypage";
import { deleteProject } from "../../api/projects";
import { useAuth } from "../../hooks/useAuth";
import { PROJECT_STATUS, PROJECT_STATUS_LABEL, PROGRESS_MODE_OPTIONS, ACTIVE_TIME_OPTIONS, USER_ROLE } from "../../constants";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import { findLabel, formatDDay } from "../../utils/format";

// 최근 질문·답변은 5개만
const RECENT_SIZE = 5;


// 팀 카드 아래 줄: "팀원 2 / 4명 · 온라인 · 평일 저녁"
const getTeamMeta = (team) => {
    const progress = findLabel(PROGRESS_MODE_OPTIONS, team.progressMode);
    const times = team.activeTimes.map((time) => findLabel(ACTIVE_TIME_OPTIONS, time)).join(", ");
    return `팀원 ${team.memberCount} / ${team.capacity}명 · ${progress} · ${times}`;
};

// 마감 칸: 모집완료면 "마감", 아니면 D-Day
const getDeadlineText = (project) => {
    if (project.status === PROJECT_STATUS.CLOSED) {
        return "마감";
    }
    return formatDDay(project.dDay);
};

// 대기 칸: 모집완료면 "-"
const getPendingText = (project) => {
    if (project.status === PROJECT_STATUS.CLOSED) {
        return "-";
    }
    return project.pendingCount;
};



// 질문 링크: 모집 글에 단 질문이면 모집 글 상세로
const getQuestionLink = (projectId, questionId) => {
    if (projectId) {
        return `/projects/${projectId}`;
    }
    return `/questions/${questionId}`;
};

function ActivityTab() {
    const { user } = useAuth();
    const isAdmin = user?.role === USER_ROLE.ADMIN;
    const location = useLocation();
    const teamsRef = useRef(null);
    const projectsRef = useRef(null);

    // 상태: 네 구역 데이터, 불러오기 중/실패, 다시 시도, 삭제 중인 글
    const [activity, setActivity] = useState({ teams: [], projects: [], questions: [], answers: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    const [deletingId, setDeletingId] = useState(null);
    const [actionError, setActionError] = useState("");

    // 네 구역을 한 번에 불러오기
    useEffect(() => {
        let ignore = false;

        const loadActivity = async () => {
            try {
                const [teamsRes, projectsRes, questionsRes, answersRes] = await Promise.all([
                    getMyTeams({ size: 50 }),
                    getMyProjects({ size: 50 }),
                    getMyQuestions({ size: RECENT_SIZE }),
                    getMyAnswers({ size: RECENT_SIZE }),
                ]);
                if (ignore) {
                    return;
                }
                setActivity({
                    teams: teamsRes.data.data.items,
                    projects: projectsRes.data.data.items,
                    questions: questionsRes.data.data.items,
                    answers: answersRes.data.data.items,
                });
            } catch (error) {
                if (ignore) {
                    return;
                }
                let message = "마이페이지 정보를 불러오지 못했습니다.";
                if (error.response && error.response.data && error.response.data.message) {
                    message = error.response.data.message;
                }
                setLoadError(message);
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        };

        loadActivity();

        return () => {
            ignore = true;
        };
    }, [reloadKey]);

    // 메뉴(참여 중인 팀 / 내 모집 글 관리)를 누르면 그 구역으로 스크롤
    useEffect(() => {
        if (isLoading) {
            return;
        }
        if (location.pathname === "/mypage/projects" && projectsRef.current) {
            projectsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (location.pathname === "/mypage/teams" && teamsRef.current) {
            teamsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [location.pathname, isLoading]);

    // 다시 시도
    const handleReload = () => {
        setLoadError("");
        setIsLoading(true);
        setReloadKey(reloadKey + 1);
    };

    // 모집 글 삭제 
    const handleDelete = async (project) => {
        if (deletingId) {
            return;
        }
        if (!window.confirm(`'${project.title}' 모집 글을 삭제할까요?\n대기 중인 참여·초대 요청은 취소됩니다.`)) {
            return;
        }

        setActionError("");
        setDeletingId(project.id);

        try {
            await deleteProject(project.id);
            // 삭제한 글은 내 모집 글·참여 중인 팀에서 함께 제외
            setActivity({
                ...activity,
                projects: activity.projects.filter((item) => item.id !== project.id),
                teams: activity.teams.filter((item) => item.projectId !== project.id),
            });
        } catch (error) {
            let message = "모집 글을 삭제하지 못했습니다. 다시 시도해 주세요.";
            if (error.response && error.response.data && error.response.data.message) {
                message = error.response.data.message;
            }
            setActionError(message);
        } finally {
            setDeletingId(null);
        }
    };

    // 6. 불러오는 중 / 실패
    if (isLoading) {
        return <p className="activity__notice">마이페이지 정보를 불러오는 중입니다.</p>;
    }

    if (loadError) {
        return (
            <div className="activity__notice activity__notice--error" role="alert">
                <p>{loadError}</p>
                <button type="button" className="activity__button activity__button--primary" onClick={handleReload}>
                    다시 시도
                </button>
            </div>
        );
    }

    const { teams, projects, questions, answers } = activity;

    return (
        <div className="activity">
            {/* ===== 참여 중인 팀 ===== */}
            <section className="activity-card" ref={teamsRef} aria-labelledby="my-teams-title">
                <div className="activity-card__header">
                    <h2 id="my-teams-title" className="activity-card__title">참여 중인 팀</h2>
                    <span className="activity-card__hint">같은 팀에는 한 번만 참여할 수 있어요</span>
                </div>

                {teams.length === 0 && (
                    <p className="activity-card__empty">참여 중인 팀이 없어요. 모집 게시판에서 팀을 찾아보세요.</p>
                )}

                {teams.map((team) => (
                    <article key={team.projectId} className="team-item">
                        <div className="team-item__body">
                            <div className="team-item__badges">
                                <span className={`activity__level activity__level--${team.targetLevel.toLowerCase()}`}>
                                    {team.targetLevel}
                                </span>
                                <span className={team.status === PROJECT_STATUS.OPEN ? "activity__status activity__status--open" : "activity__status"}>
                                    {PROJECT_STATUS_LABEL[team.status]}
                                </span>
                                <span className="activity__role">{team.role === "LEADER" ? "모집자" : "팀원"}</span>
                            </div>
                            <p className="team-item__title">{team.title}</p>
                            <p className="team-item__meta">{getTeamMeta(team)}</p>
                        </div>

                        <div className="team-item__side">
                            <div className="team-item__avatars" aria-label={`팀원 ${team.memberNicknames.join(", ")}`}>
                                {team.memberNicknames.map((nickname) => (
                                    <span key={nickname} className="team-item__avatar" title={nickname}>
                                        {nickname.slice(0, 1)}
                                    </span>
                                ))}
                            </div>
                            <Link to={`/projects/${team.projectId}`} className="activity__button">상세 보기</Link>
                        </div>
                    </article>
                ))}
            </section>

            {/* ===== 내 모집 글 관리 ===== */}
            <section className="activity-card activity-card--table" ref={projectsRef} aria-labelledby="my-projects-title">
                <div className="activity-card__header">
                    <h2 id="my-projects-title" className="activity-card__title">내 모집 글 관리</h2>
                    {!isAdmin && (
                        <Link to="/projects/new" className="activity__button activity__button--primary">+ 모집 글 작성</Link>
                    )}
                </div>

                {actionError && <p className="activity__error" role="alert">{actionError}</p>}

                {projects.length === 0 && (
                    <p className="activity-card__empty">작성한 모집 글이 없어요. 첫 모집 글을 작성해 보세요.</p>
                )}

                {projects.length > 0 && (
                    <table className="project-table">
                        <thead>
                            <tr>
                                <th scope="col">모집 글</th>
                                <th scope="col">레벨</th>
                                <th scope="col">상태</th>
                                <th scope="col">인원</th>
                                <th scope="col">대기</th>
                                <th scope="col">마감</th>
                                <th scope="col"><span className="activity__sr-only">관리</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project) => (
                                <tr key={project.id}>
                                    <td className="project-table__title">
                                        <Link to={`/projects/${project.id}`}>{project.title}</Link>
                                    </td>
                                    <td>
                                        <span className={`activity__level activity__level--${project.targetLevel.toLowerCase()}`}>
                                            {project.targetLevel}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={project.status === PROJECT_STATUS.OPEN ? "activity__status activity__status--open" : "activity__status"}>
                                            {PROJECT_STATUS_LABEL[project.status]}
                                        </span>
                                    </td>
                                    <td>{project.memberCount} / {project.capacity}</td>
                                    <td className={project.status === PROJECT_STATUS.OPEN && project.pendingCount > 0 ? "project-table__pending" : ""}>
                                        {getPendingText(project)}
                                    </td>
                                    <td>{getDeadlineText(project)}</td>
                                    <td>
                                        <div className="project-table__actions">
                                            <Link to={`/projects/${project.id}/manage`} className="activity__button">지원자 관리</Link>
                                            <Link to={`/projects/${project.id}/edit`} className="activity__button">수정</Link>
                                            <button
                                                type="button"
                                                className="activity__button activity__button--danger"
                                                onClick={() => handleDelete(project)}
                                                disabled={deletingId === project.id}
                                            >
                                                {deletingId === project.id ? "삭제 중…" : "삭제"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {/* ===== 최근 작성한 질문 / 답변 ===== */}
            <div className="activity__recent">
                <section className="activity-card" aria-labelledby="my-questions-title">
                    <h2 id="my-questions-title" className="activity-card__title">최근 작성한 질문</h2>
                    {questions.length === 0 && <p className="activity-card__empty">작성한 질문이 없어요.</p>}
                    <ul className="recent-list">
                        {questions.map((question) => (
                            <li key={question.id} className="recent-list__item">
                                <Link to={getQuestionLink(question.projectId, question.id)} className="recent-list__title">
                                    {question.title}
                                </Link>
                                <span className={question.isSolved ? "recent-list__badge recent-list__badge--solved" : "recent-list__badge recent-list__badge--unsolved"}>
                                    {question.isSolved ? "해결됨" : "미해결"}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="activity-card" aria-labelledby="my-answers-title">
                    <h2 id="my-answers-title" className="activity-card__title">최근 작성한 답변</h2>
                    {answers.length === 0 && <p className="activity-card__empty">작성한 답변이 없어요.</p>}
                    <ul className="recent-list">
                        {answers.map((answer) => {
                            const time = formatRelativeTime(answer.createdAt);

                            return (
                                <li key={answer.id} className="recent-list__item">
                                    <Link to={getQuestionLink(answer.projectId, answer.questionId)} className="recent-list__title">
                                        {answer.questionTitle}
                                    </Link>
                                    {answer.isAccepted && <span className="recent-list__badge recent-list__badge--accepted">채택</span>}
                                    {!answer.isAccepted && time && (
                                        <time className="recent-list__time" dateTime={time.dateTime} title={time.exact}>
                                            {time.label}
                                        </time>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </section>
            </div>
        </div>
    );
}

export default ActivityTab;