import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecommendedMembers } from "../api/members";
import { getRecommendedProjects } from "../api/projects";
import { useAuth } from "../hooks/useAuth";
import {
  ACTIVE_TIME_OPTIONS,
  COLLABORATION_OPTIONS,
  LEVEL_OPTIONS,
  PROGRESS_MODE_OPTIONS,
} from "../constants";
import "./HomePage.css";

const levelLabels = Object.fromEntries(LEVEL_OPTIONS.map(({ code, label }) => [code, label]));
const collaborationLabels = Object.fromEntries(
  COLLABORATION_OPTIONS.map(({ code, label }) => [code, label]),
);
const progressModeLabels = Object.fromEntries(
  PROGRESS_MODE_OPTIONS.map(({ code, label }) => [code, label]),
);
const activeTimeLabels = Object.fromEntries(
  ACTIVE_TIME_OPTIONS.map(({ code, label }) => [code, label]),
);

const splitSet = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
};

const normalizeMember = (member) => ({
  ...member,
  id: Number(member.id),
  activeTimes: splitSet(member.activeTimes),
  totalScore: Number(member.totalScore ?? 0),
});

const responseItems = (response) => {
  const data = response?.data?.data;
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
};

function SectionHeading({ id, title, to, linkLabel }) {
  return (
    <div className="home-section__heading">
      <h2 id={id}>{title}</h2>
      <Link className="home-section__more" to={to}>
        {linkLabel}<span aria-hidden="true">›</span>
      </Link>
    </div>
  );
}

function BlindProjectCard() {
  return (
    <article className="home-project-card home-skeleton-card" aria-hidden="true">
      <div className="home-skeleton-card__top"><i /><i /></div>
      <i className="home-skeleton-card__title" />
      <i className="home-skeleton-card__line" />
      <i className="home-skeleton-card__progress" />
      <div className="home-skeleton-card__bottom"><i /><i /></div>
    </article>
  );
}

function BlindMemberCard() {
  return (
    <article className="home-member-card home-skeleton-card" aria-hidden="true">
      <div className="home-skeleton-member__identity">
        <i className="home-skeleton-member__avatar" />
        <i className="home-skeleton-card__title" />
      </div>
      <i className="home-skeleton-card__line" />
      <i className="home-skeleton-card__line home-skeleton-card__line--short" />
      <i className="home-skeleton-member__button" />
    </article>
  );
}

function ProjectCard({ project }) {
  const activeTimes = splitSet(project.activeTimes);
  const dDay = Number(project.dDay);
  const dDayLabel = project.dDay === null || !Number.isFinite(dDay)
    ? "마감일 확인"
    : dDay === 0 ? "오늘 마감" : `D-${dDay}`;
  const memberCount = Number(project.memberCount ?? 0);
  const capacity = Number(project.capacity ?? 0);
  const progress = capacity ? Math.min((memberCount / capacity) * 100, 100) : 0;

  return (
    <article className="home-project-card">
      <div className="home-project-card__topline">
        <span className={`home-level-tag home-level-tag--${project.targetLevel?.toLowerCase()}`}>
          {levelLabels[project.targetLevel] ?? project.targetLevel}
        </span>
        <span className="home-open-tag">모집중</span>
      </div>
      <Link className="home-project-card__title" to={`/projects/${project.id}`}>
        {project.title}
      </Link>
      <div className="home-project-card__meta">
        <span>{memberCount}/{capacity}명 모집</span>
        <span>{dDayLabel}</span>
      </div>
      <div className="home-project-card__progress" aria-label={`${memberCount}명 지원, 정원 ${capacity}명`}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="home-project-card__tags">
        <span>{progressModeLabels[project.progressMode] ?? project.progressMode}</span>
        <span>{activeTimes.map((time) => activeTimeLabels[time] ?? time).join(" · ") || "활동 시간 미정"}</span>
        <span>질문 {Number(project.questionCount ?? 0)}</span>
      </div>
    </article>
  );
}

function MemberCard({ member }) {
  const activeTimes = member.activeTimes.slice(0, 1);
  const initial = member.nickname?.trim().charAt(0) || "?";

  return (
    <article className="home-member-card">
      <span className="home-member-card__avatar" aria-hidden="true">{initial}</span>
      <strong className="home-member-card__name">{member.nickname}</strong>
      <span className={`home-level-tag home-level-tag--${member.level?.toLowerCase()}`}>
        {levelLabels[member.level] ?? member.level} · {member.totalScore.toFixed(1)}점
      </span>
      <div className="home-member-card__details">
        <span>{collaborationLabels[member.collaborationMode] ?? member.collaborationMode}</span>
        {activeTimes.map((time) => <span key={time}>{activeTimeLabels[time] ?? time}</span>)}
      </div>
      <Link className="home-member-card__link" to={`/members/${member.id}`}>프로필 보기</Link>
    </article>
  );
}

function RecommendationState({ status, error, onRetry, emptyMessage }) {
  if (status === "loading") {
    return <div className="home-state" role="status">추천을 불러오는 중입니다.</div>;
  }
  if (status === "error") {
    return (
      <div className="home-state home-state--error" role="alert">
        <span>{error}</span>
        <button className="home-state__retry" onClick={onRetry} type="button">다시 시도</button>
      </div>
    );
  }
  if (status === "empty") return <div className="home-state">{emptyMessage}</div>;
  return null;
}

export default function HomePage() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [projectState, setProjectState] = useState({ status: "loading", items: [], error: "" });
  const [memberState, setMemberState] = useState({ status: "loading", items: [], error: "" });
  const isBlind = !authLoading && !isLoggedIn;

  useEffect(() => {
    if (authLoading || !isLoggedIn) return undefined;

    let active = true;
    const ownerId = user?.id;
    Promise.allSettled([getRecommendedProjects(), getRecommendedMembers()]).then(([projectsResult, membersResult]) => {
      if (!active) return;
      if (projectsResult.status === "fulfilled") {
        const items = responseItems(projectsResult.value);
        setProjectState({ status: items.length ? "success" : "empty", items, error: "", ownerId });
      } else {
        setProjectState({
          status: "error",
          items: [],
          error: projectsResult.reason?.response?.data?.message ?? "프로젝트 추천을 불러오지 못했습니다.",
          ownerId,
        });
      }
      if (membersResult.status === "fulfilled") {
        const items = responseItems(membersResult.value).map(normalizeMember);
        setMemberState({ status: items.length ? "success" : "empty", items, error: "", ownerId });
      } else {
        setMemberState({
          status: "error",
          items: [],
          error: membersResult.reason?.response?.data?.message ?? "팀원 추천을 불러오지 못했습니다.",
          ownerId,
        });
      }
    });

    return () => { active = false; };
  }, [authLoading, isLoggedIn, refreshKey, user?.id]);

  const retry = () => {
    setProjectState((current) => ({ ...current, status: "loading", error: "" }));
    setMemberState((current) => ({ ...current, status: "loading", error: "" }));
    setRefreshKey((key) => key + 1);
  };

  const projectStatus = projectState.ownerId === user?.id ? projectState.status : "loading";
  const memberStatus = memberState.ownerId === user?.id ? memberState.status : "loading";
  const projectTitle = isLoggedIn && user?.level
    ? `${levelLabels[user.level] ?? user.level} ${user.nickname} 님 수준에 맞는 프로젝트`
    : "내 수준에 맞는 추천 프로젝트";

  return (
    <main className="home-page">
      <div className="home-shell">
        <section className="home-hero" aria-labelledby="home-title">
          <p className="home-hero__kicker">비전공자 취준생을 위한 팀 프로젝트 매칭</p>
          <h1 id="home-title">내 실력에 맞는 프로젝트,<br />함께할 <em>PIECE</em>를 찾아보세요</h1>
          <p className="home-hero__description">
            자격증 · 수상 · 프로젝트 이력으로 산정한 객관적인 레벨로 비슷한 수준의 팀원과 프로젝트를 만나보세요.
          </p>
        </section>

        <div className="home-recommendations">
          <section
            className="home-section"
            aria-labelledby="home-projects-title"
            aria-label={isBlind ? "로그인하면 내 수준에 맞는 프로젝트 추천을 확인할 수 있습니다." : undefined}
          >
            <div className="home-section__content">
              <SectionHeading id="home-projects-title" title={projectTitle} to="/projects" linkLabel="모집 게시판 전체보기" />
              {isBlind || authLoading ? (
                <div className="home-project-grid home-project-grid--blind" aria-hidden="true">{[1, 2, 3].map((item) => <BlindProjectCard key={item} />)}</div>
              ) : projectStatus === "success" ? (
                <div className="home-project-grid">
                  {projectState.items.map((project) => <ProjectCard key={project.id} project={project} />)}
                </div>
              ) : (
                <RecommendationState
                  status={projectStatus}
                  error={projectState.error}
                  onRetry={retry}
                  emptyMessage="지금은 추천할 프로젝트가 없어요. 모집 게시판에서 더 찾아보세요."
                />
              )}
            </div>
            {isBlind && <span className="home-visually-hidden">로그인하면 프로젝트 추천을 확인할 수 있습니다.</span>}
          </section>

          <section
            className="home-section"
            aria-labelledby="home-members-title"
            aria-label={isBlind ? "로그인하면 비슷한 실력의 추천 팀원을 확인할 수 있습니다." : undefined}
          >
            <div className="home-section__content">
              <SectionHeading id="home-members-title" title="비슷한 실력의 추천 팀원" to="/members" linkLabel="팀원 찾기" />
              {isBlind || authLoading ? (
                <div className="home-member-grid home-member-grid--blind" aria-hidden="true">{[1, 2, 3, 4].map((item) => <BlindMemberCard key={item} />)}</div>
              ) : memberStatus === "success" ? (
                <div className="home-member-grid">
                  {memberState.items.map((member) => <MemberCard key={member.id} member={member} />)}
                </div>
              ) : (
                <RecommendationState
                  status={memberStatus}
                  error={memberState.error}
                  onRetry={retry}
                  emptyMessage="지금은 추천할 팀원이 없어요. 팀원 찾기에서 둘러보세요."
                />
              )}
            </div>
            {isBlind && <span className="home-visually-hidden">로그인하면 비슷한 실력의 팀원 추천을 확인할 수 있습니다.</span>}
          </section>
        </div>

        <footer className="home-footer">PIECE · 6th DevMates</footer>
      </div>
    </main>
  );
}
