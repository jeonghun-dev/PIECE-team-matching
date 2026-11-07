import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  InviteModal,
  MemberFooter,
  MemberHeader,
  MemberMark,
  MemberShell,
} from "./MemberUI";
import {
  certificateLabels,
  activeTimeLabels,
  collaborationLabels,
  members,
} from "./memberData";
import "./MemberPages.css";

const levelLabels = ["STARTER", "BUILDER", "ACHIEVER"];

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
          <span className="looking-badge">팀 구하는 중</span>
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
          <Link className="button button--outline" to={`/members/${member.id}`}>
            프로필 보기
          </Link>
          <button
            className="button button--primary"
            onClick={() => setIsInviteOpen(true)}
            type="button"
          >
            프로젝트에 초대
          </button>
        </div>
      </article>
      {isInviteOpen && (
        <InviteModal member={member} onClose={() => setIsInviteOpen(false)} />
      )}
    </>
  );
}

export default function MemberList() {
  const [levels, setLevels] = useState(["BUILDER"]);
  const [collaborationMode, setCollaborationMode] = useState("ONLINE");
  const [activeTime, setActiveTime] = useState("WEEKDAY_NIGHT");
  const [sortOrder, setSortOrder] = useState("recent");
  const [appliedFilters, setAppliedFilters] = useState({
    levels: [],
    collaborationMode: "",
    activeTime: "",
  });

  const filteredMembers = useMemo(() => {
    const result = members.filter((member) => {
      const matchesLevel =
        appliedFilters.levels.length === 0 ||
        appliedFilters.levels.includes(member.level);
      const matchesMode =
        !appliedFilters.collaborationMode ||
        member.collaborationMode === appliedFilters.collaborationMode ||
        member.collaborationMode === "ANY";
      const matchesTime =
        !appliedFilters.activeTime ||
        member.activeTimes.includes(appliedFilters.activeTime);
      return member.lookingForTeam && matchesLevel && matchesMode && matchesTime;
    });

    return sortOrder === "score"
      ? [...result].sort((a, b) => b.totalScore - a.totalScore)
      : result;
  }, [appliedFilters, sortOrder]);

  function toggleLevel(level) {
    setLevels((selected) =>
      selected.includes(level)
        ? selected.filter((item) => item !== level)
        : [...selected, level],
    );
  }

  function submitSearch(event) {
    event.preventDefault();
    setAppliedFilters({ levels, collaborationMode, activeTime });
  }

  return (
    <MemberShell>
      <MemberHeader activeItem="members" />
      <main className="member-content">
        <section className="member-page-heading">
          <h1>팀원 찾기</h1>
          <p>팀을 구하는 중인 사용자를 레벨 · 협업 방식 · 활동 시간으로 찾아 내 프로젝트로 초대하세요</p>
        </section>

        <form className="member-filters" onSubmit={submitSearch}>
          <fieldset className="filter-group filter-group--levels">
            <legend>레벨</legend>
            <div className="filter-options">
              {levelLabels.map((level) => (
                <button
                  className={`filter-chip${levels.includes(level) ? " is-active" : ""}`}
                  key={level}
                  onClick={() => toggleLevel(level)}
                  type="button"
                  aria-pressed={levels.includes(level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="filter-group">
            <legend>협업 방식</legend>
            <div className="filter-options">
              {Object.entries(collaborationLabels).map(([mode, label]) => (
                <button
                  className={`filter-chip${collaborationMode === mode ? " is-active" : ""}`}
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

          <label className="filter-group filter-group--time">
            <span className="filter-label">주요 활동 시간</span>
            <select value={activeTime} onChange={(event) => setActiveTime(event.target.value)}>
              <option value="">전체 시간</option>
              {Object.entries(activeTimeLabels).map(([time, label]) => (
                <option key={time} value={time}>{label}</option>
              ))}
            </select>
          </label>

          <button className="button button--primary search-button" type="submit">
            <span aria-hidden="true">⌕</span> 검색
          </button>
        </form>

        <div className="member-results-heading">
          <p>검색 결과 <strong>{filteredMembers.length}명</strong></p>
          <label>
            <span className="sr-only">정렬 기준</span>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
              <option value="recent">최신순</option>
              <option value="score">레벨 높은 순</option>
            </select>
          </label>
        </div>

        {filteredMembers.length ? (
          <section aria-label="팀원 검색 결과" className="member-grid">
            {filteredMembers.map((member) => <MemberCard key={member.id} member={member} />)}
          </section>
        ) : (
          <div className="member-empty-state">
            <strong>검색 결과가 없습니다</strong>
            <p>필터를 변경하거나 다른 검색어를 입력해 보세요.</p>
          </div>
        )}
      </main>
      <MemberFooter />
    </MemberShell>
  );
}
