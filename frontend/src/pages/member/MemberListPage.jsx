import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  InviteModal,
  MemberMark,
} from "./MemberUI";
import {
  ACTIVE_TIME,
  ACTIVE_TIME_OPTIONS,
  CERTIFICATE_OPTIONS,
  COLLABORATION_MODE,
  COLLABORATION_OPTIONS,
  LEVEL,
  LEVEL_OPTIONS,
} from "../../constants";
import { getMembers } from "../../api/members";
import { inviteToProject } from "../../api/requests";
import "./MemberPages.css";

const certificateLabels = Object.fromEntries(CERTIFICATE_OPTIONS.map(({ code, label }) => [code, label]));
const activeTimeLabels = Object.fromEntries(ACTIVE_TIME_OPTIONS.map(({ code, label }) => [code, label]));
const collaborationLabels = Object.fromEntries(COLLABORATION_OPTIONS.map(({ code, label }) => [code, label]));

function MemberCard({ member }) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const certificateLabel = member.certificates
    .slice(0, 2)
    .map((certificate) => certificateLabels[certificate] ?? certificate)
    .join(" · ");

  return (
    <>
      <article className="member-card">
        <div className="member-card__heading">
          <MemberMark name={member.nickname} />
          <div className="member-card__identity">
            <strong>{member.nickname}</strong>
            <span className="member-level">
              {member.level} · {member.totalScore}점
            </span>
          </div>
            {member.lookingForTeam && <span className="member-card__looking-badge">팀 구하는 중</span>}
        </div>

        <p className="member-card__intro">{member.intro}</p>
        <div className="member-card__history">
          <span aria-hidden="true">🏅</span>
          {certificateLabel || "학습 이력을 등록하지 않았어요"}
          <span className="member-card__project-count">
            · 프로젝트 {member.projectCount}
          </span>
        </div>
        <div className="member-card__meta">
          <span><span aria-hidden="true">♧</span> {collaborationLabels[member.collaborationMode]}</span>
          <span><span aria-hidden="true">◷</span> {activeTimeLabels[member.activeTimes[0]]}</span>
        </div>
        <div className="member-card__actions">
          <Link className="member-page__button member-page__button--outline" to={`/members/${member.id}`}>
            프로필 보기
          </Link>
            <button
            className="member-page__button member-page__button--primary"
              onClick={() => setIsInviteOpen(true)}
            type="button"
          >
            프로젝트에 초대
          </button>
        </div>
      </article>
      {isInviteOpen && (
        <InviteModal member={member} onClose={() => setIsInviteOpen(false)} onInvite={inviteToProject} />
      )}
    </>
  );
}

export default function MemberList() {
  const [levels, setLevels] = useState([LEVEL.BUILDER]);
  const [collaborationMode, setCollaborationMode] = useState(COLLABORATION_MODE.ONLINE);
  const [activeTime, setActiveTime] = useState(ACTIVE_TIME.WEEKDAY_NIGHT);
  const [sortOrder, setSortOrder] = useState("recent");
  const [appliedFilters, setAppliedFilters] = useState({
    levels: [LEVEL.BUILDER],
    collaborationMode: COLLABORATION_MODE.ONLINE,
    activeTime: ACTIVE_TIME.WEEKDAY_NIGHT,
  });
  const [members, setMembers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getMembers({
      ...(appliedFilters.levels.length ? { level: appliedFilters.levels.join(",") } : {}),
      ...(appliedFilters.collaborationMode ? { collaborationMode: appliedFilters.collaborationMode } : {}),
      ...(appliedFilters.activeTime ? { activeTime: appliedFilters.activeTime } : {}),
      page: 1,
      size: 50,
    }).then(({ data }) => {
      if (active) {
        setMembers((data.data?.items ?? []).map(normalizeMember));
        setTotalCount(Number(data.data?.totalCount ?? 0));
      }
    }).catch(() => {
      if (active) setError("팀원 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [appliedFilters]);

  const filteredMembers = useMemo(() => {
    return sortOrder === "score" ? [...members].sort((a, b) => b.totalScore - a.totalScore) : members;
  }, [members, sortOrder]);

  function toggleLevel(level) {
    setLevels((selected) =>
      selected.includes(level)
        ? selected.filter((item) => item !== level)
        : [...selected, level],
    );
  }

  function submitSearch(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setAppliedFilters({ levels, collaborationMode, activeTime });
  }

  return (
    <main className="member-page">
      <div className="member-content">
        <section className="member-list__heading">
          <h1>팀원 찾기</h1>
          <p>팀을 구하는 중인 사용자를 레벨 · 협업 방식 · 활동 시간으로 찾아 내 프로젝트로 초대하세요</p>
        </section>

        <form className="member-list__filters" onSubmit={submitSearch}>
          <fieldset className="member-list__filter-group member-list__filter-group--levels">
            <legend>레벨</legend>
            <div className="member-list__filter-options">
              {LEVEL_OPTIONS.map(({ code: level, label }) => (
                <button
                  className={`member-list__filter-chip${levels.includes(level) ? " member-list__filter-chip--active" : ""}`}
                  key={level}
                  onClick={() => toggleLevel(level)}
                  type="button"
                  aria-pressed={levels.includes(level)}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="member-list__filter-group">
            <legend>협업 방식</legend>
            <div className="member-list__filter-options">
              {COLLABORATION_OPTIONS.map(({ code: mode, label }) => (
                <button
                  className={`member-list__filter-chip${collaborationMode === mode ? " member-list__filter-chip--active" : ""}`}
                  key={mode}
                  onClick={() => setCollaborationMode(collaborationMode === mode ? "" : mode)}
                  type="button"
                  aria-pressed={collaborationMode === mode}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="member-list__filter-group member-list__filter-group--time">
            <span className="member-list__filter-label">주요 활동 시간</span>
            <select value={activeTime} onChange={(event) => setActiveTime(event.target.value)}>
              <option value="">전체 시간</option>
              {ACTIVE_TIME_OPTIONS.map(({ code: time, label }) => (
                <option key={time} value={time}>{label}</option>
              ))}
            </select>
          </label>

          <button className="member-page__button member-page__button--primary member-list__search-button" type="submit">
            <span aria-hidden="true">⌕</span> 검색
          </button>
        </form>

        <div className="member-list__results-heading">
          <p>검색 결과 <strong>{totalCount}명</strong></p>
          <label>
            <span className="member-page__visually-hidden">정렬 기준</span>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
              <option value="recent">최신순</option>
              <option value="score">레벨 높은 순</option>
            </select>
          </label>
        </div>

        {loading ? <div className="member-page__empty-state" role="status">팀원 목록을 불러오는 중입니다.</div> : error ? (
          <div className="member-page__empty-state" role="alert">{error}</div>
        ) : filteredMembers.length ? (
          <section aria-label="팀원 검색 결과" className="member-list__grid">
            {filteredMembers.map((member) => <MemberCard key={member.id} member={member} />)}
          </section>
        ) : (
          <div className="member-page__empty-state">
            <strong>검색 결과가 없습니다</strong>
            <p>필터를 변경하거나 다른 검색어를 입력해 보세요.</p>
          </div>
        )}
      </div>
    </main>
  );
}

function normalizeMember(member) {
  const split = (value) => Array.isArray(value) ? value : String(value ?? "").split(",").filter(Boolean);
  return {
    ...member,
    id: Number(member.id),
    activeTimes: split(member.activeTimes),
    certificates: split(member.certificates),
    lookingForTeam: Boolean(member.lookingForTeam),
    totalScore: Number(member.totalScore ?? 0),
    awardCount: Number(member.awardCount ?? 0),
    projectCount: Number(member.projectCount ?? 0),
  };
}
