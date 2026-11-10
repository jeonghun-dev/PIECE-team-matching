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
  certificates: splitSet(member.certificates),
  totalScore: Number(member.totalScore ?? 0),
  projectCount: Number(member.projectCount ?? 0),
  lookingForTeam: Boolean(member.lookingForTeam),
});

const responseItems = (response) => {
  const data = response?.data?.data;
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
};

function SectionHeading({ id, eyebrow, title, description, to, linkLabel }) {
  return (
    <div className="home-section__heading">
      <div>
        <p className="home-section__eyebrow">{eyebrow}</p>
        <h2 id={id}>{title}</h2>
        <p className="home-section__description">{description}</p>
      </div>
      <Link className="home-section__more" to={to}>
        {linkLabel}<span aria-hidden="true">↗</span>
      </Link>
    </div>
  );
}

function BlindRecommendations() {
  return (
    <div className="home-blind" aria-label="로그인 후 추천을 확인할 수 있습니다">
      <div className="home-blind__previews" aria-hidden="true">
        <div className="home-blind-card home-blind-card--project">
          <span className="home-blind-card__badge" />
          <span className="home-blind-card__line home-blind-card__line--long" />
          <span className="home-blind-card__line" />
          <span className="home-blind-card__chips"><i /><i /><i /></span>
        </div>
        <div className="home-blind-card home-blind-card--member">
          <span className="home-blind-card__avatar" />
          <span className="home-blind-card__line home-blind-card__line--long" />
          <span className="home-blind-card__line" />
          <span className="home-blind-card__chips"><i /><i /></span>
        </div>
        <div className="home-blind-card home-blind-card--project home-blind-card--third">
          <span className="home-blind-card__badge" />
          <span className="home-blind-card__line home-blind-card__line--long" />
          <span className="home-blind-card__line" />
          <span className="home-blind-card__chips"><i /><i /><i /></span>
        </div>
      </div>
      <div className="home-blind__message">
        <span className="home-blind__lock" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3" />
          </svg>
        </span>
        <strong>내 레벨에 맞는 추천을 확인해 보세요</strong>
        <p>로그인하면 프로젝트와 팀원 추천이 열립니다.</p>
        <Link className="home-button home-button--primary" to="/login">로그인하고 추천 보기</Link>
      </div>
    </div>
  );
}

function ProjectCard({ project }) {
  const activeTimes = splitSet(project.activeTimes);
  const dDay = Number(project.dDay);
  const dDayLabel = project.dDay === null || !Number.isFinite(dDay)
    ? "마감일 확인"
    : dDay === 0 ? "오늘 마감" : `D-${dDay}`;

  return (
    <article className="home-project-card">
      <div className="home-project-card__topline">
        <span className="home-level-tag">{levelLabels[project.targetLevel] ?? project.targetLevel}</span>
        <span className={`home-deadline${dDay <= 3 ? " home-deadline--soon" : ""}`}>{dDayLabel}</span>
      </div>
      <Link className="home-project-card__title" to={`/projects/${project.id}`}>
        {project.title}
      </Link>
      <p className="home-project-card__summary">
        {project.contentPreview?.trim() || "프로젝트 상세 내용을 확인해 보세요."}
      </p>
      <div className="home-project-card__tags">
        <span>{progressModeLabels[project.progressMode] ?? project.progressMode}</span>
        {activeTimes.slice(0, 2).map((time) => (
          <span key={time}>{activeTimeLabels[time] ?? time}</span>
        ))}
      </div>
      <div className="home-project-card__footer">
        <span><span aria-hidden="true">♙</span> 팀원 {Number(project.memberCount ?? 0)}/{project.capacity}명</span>
        <Link to={`/projects/${project.id}`} aria-label={`${project.title} 자세히 보기`}>자세히 보기 <span aria-hidden="true">→</span></Link>
      </div>
    </article>
  );
}

function MemberCard({ member }) {
  const activeTimes = member.activeTimes.slice(0, 2);
  const initial = member.nickname?.trim().charAt(0) || "?";

  return (
    <article className="home-member-card">
      <div className="home-member-card__identity">
        <span className="home-member-card__avatar" aria-hidden="true">{initial}</span>
        <div className="home-member-card__name-wrap">
          <strong>{member.nickname}</strong>
          <span className="home-level-tag">{levelLabels[member.level] ?? member.level}</span>
        </div>
      </div>
      <p className="home-member-card__intro">
        {member.intro?.trim() || "아직 한 줄 소개를 작성하지 않았어요."}
      </p>
      <div className="home-member-card__details">
        <span>{collaborationLabels[member.collaborationMode] ?? member.collaborationMode}</span>
        {activeTimes.map((time) => <span key={time}>{activeTimeLabels[time] ?? time}</span>)}
      </div>
      <div className="home-member-card__footer">
        <span>학습 점수 {member.totalScore.toFixed(1)}점</span>
        <Link to={`/members/${member.id}`}>프로필 보기 <span aria-hidden="true">→</span></Link>
      </div>
    </article>
  );
}

function RecommendationState({ status, error, onRetry, emptyMessage }) {
  if (status === "loading") {
    return <div className="home-state" role="status"><span className="home-spinner" />추천을 불러오는 중입니다.</div>;
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

  useEffect(() => {
    if (authLoading) return undefined;
    if (!isLoggedIn) return undefined;

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

  return (
    <main className="home-page">
      <div className="home-shell">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero__content">
            <span className="home-hero__kicker"><i /> PIECE 커뮤니티</span>
            <h1 id="home-title">
              {isLoggedIn ? <>{user?.nickname}님, 다음 조각을<br /><em>함께 완성해요.</em></> : <>나에게 맞는 팀과<br /><em>프로젝트를 찾아보세요.</em></>}
            </h1>
            <p>배움의 속도와 방향이 맞는 사람들과<br className="home-hero__desktop-break" /> 작은 조각을 모아 멋진 결과를 만들어 보세요.</p>
            <div className="home-hero__actions">
              <Link className="home-button home-button--primary" to="/projects">프로젝트 둘러보기 <span aria-hidden="true">→</span></Link>
              <Link className="home-button home-button--secondary" to="/members">팀원 찾아보기</Link>
            </div>
          </div>
          <div className="home-hero__art" aria-hidden="true">
            <div className="home-art__orbit home-art__orbit--outer" />
            <div className="home-art__orbit home-art__orbit--inner" />
            <div className="home-art__piece home-art__piece--back" />
            <div className="home-art__piece home-art__piece--front"><span>PIECE</span><i /></div>
            <span className="home-art__spark home-art__spark--one">✳</span>
            <span className="home-art__spark home-art__spark--two">✦</span>
            <span className="home-art__dot home-art__dot--one" />
            <span className="home-art__dot home-art__dot--two" />
          </div>
          {isLoggedIn && user?.level && (
            <div className="home-hero__level">
              <span>현재 나의 레벨</span>
              <strong>{levelLabels[user.level] ?? user.level}</strong>
            </div>
          )}
        </section>

        <div className="home-recommendations">
          <section className="home-section" aria-labelledby="home-projects-title">
            <SectionHeading
              id="home-projects-title"
              eyebrow="PROJECTS FOR YOU"
              title="내 레벨에 맞는 프로젝트"
              description={isLoggedIn && user?.level ? `${levelLabels[user.level] ?? user.level} 레벨에 맞춰 모집 중인 프로젝트를 모았어요.` : "나의 학습 레벨에 맞는 모집 프로젝트를 만나보세요."}
              to="/projects"
              linkLabel="모집 게시판"
            />
            {!authLoading && !isLoggedIn ? <BlindRecommendations /> : (
              <div className="home-card-grid home-card-grid--projects">
                {projectStatus === "success" ? projectState.items.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                )) : (
                  <div className="home-card-grid__state">
                    <RecommendationState
                      status={authLoading ? "loading" : projectStatus}
                      error={projectState.error}
                      onRetry={retry}
                      emptyMessage="지금은 추천할 프로젝트가 없어요. 모집 게시판에서 더 찾아보세요."
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="home-section" aria-labelledby="home-members-title">
            <SectionHeading
              id="home-members-title"
              eyebrow="PEOPLE TO BUILD WITH"
              title="함께 성장할 팀원"
              description={isLoggedIn && user?.level ? `나와 같은 ${levelLabels[user.level] ?? user.level} 레벨의 팀원을 추천해요.` : "나와 같은 레벨에서 팀을 구하는 사람들을 만나보세요."}
              to="/members"
              linkLabel="팀원 찾기"
            />
            {!authLoading && !isLoggedIn ? <BlindRecommendations /> : (
              <div className="home-card-grid home-card-grid--members">
                {memberStatus === "success" ? memberState.items.map((member) => (
                  <MemberCard key={member.id} member={member} />
                )) : (
                  <div className="home-card-grid__state">
                    <RecommendationState
                      status={authLoading ? "loading" : memberStatus}
                      error={memberState.error}
                      onRetry={retry}
                      emptyMessage="지금은 추천할 팀원이 없어요. 팀원 찾기에서 둘러보세요."
                    />
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <section className="home-bottom-cta">
          <div>
            <span className="home-bottom-cta__kicker">YOUR NEXT PIECE STARTS HERE</span>
            <h2>프로젝트를 시작할 준비가 됐나요?</h2>
            <p>함께할 팀을 찾거나, 직접 새로운 모집 글을 만들어 보세요.</p>
          </div>
          <div className="home-bottom-cta__actions">
            <Link className="home-button home-button--secondary" to="/projects">프로젝트 찾기</Link>
            {isLoggedIn ? (
              <Link className="home-button home-button--primary" to="/projects/new">모집 글 작성 <span aria-hidden="true">→</span></Link>
            ) : (
              <Link className="home-button home-button--primary" to="/signup">회원가입 <span aria-hidden="true">→</span></Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
