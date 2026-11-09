import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  InviteModal,
  MemberMark,
} from "./MemberUI";
import {
  ACTIVE_TIME_OPTIONS,
  CERTIFICATE_OPTIONS,
  COLLABORATION_OPTIONS,
} from "../../constants";
import { getMember } from "../../api/members";
import { inviteToProject } from "../../api/requests";
import "./MemberPages.css";

const activeTimeLabels = Object.fromEntries(ACTIVE_TIME_OPTIONS.map(({ code, label }) => [code, label]));
const certificateLabels = Object.fromEntries(CERTIFICATE_OPTIONS.map(({ code, label }) => [code, label]));
const collaborationLabels = Object.fromEntries(COLLABORATION_OPTIONS.map(({ code, label }) => [code, label]));

export default function MemberDetail() {
  const { id } = useParams();
  const [loadState, setLoadState] = useState({ id: null, member: null, error: "" });
  const loading = loadState.id !== id;
  const member = loading ? null : loadState.member;
  const error = loading ? "" : loadState.error;
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getMember(id).then(({ data }) => {
      if (active) setLoadState({ id, member: normalizeProfile(data.data), error: "" });
    }).catch(() => {
      if (active) setLoadState({ id, member: null, error: "회원 정보를 불러오지 못했습니다." });
    });
    return () => { active = false; };
  }, [id]);

  if (loading || error || !member) {
    return (
      <main className="member-page">
        <div className="member-content member-page__empty-state">
          <strong role={error ? "alert" : "status"}>{loading ? "회원 정보를 불러오는 중입니다." : error || "팀원 정보를 찾을 수 없습니다."}</strong>
          <Link className="member-page__button member-page__button--primary" to="/members">팀원 목록으로</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="member-page">
      <div className="member-content member-detail">
        <Link className="member-detail__back-link" to="/members">← 팀원 찾기</Link>

        <div className="member-detail__layout">
          <aside className="member-profile-card">
            <MemberMark large name={member.nickname} />
            <h1>{member.nickname}</h1>
            <span className="member-level">
              {member.level} · {member.totalScore}점
            </span>
            <p className="member-profile-card__intro">{member.intro}</p>
            <dl className="member-profile-facts">
              <div>
                <dt aria-hidden="true">♧</dt>
                <dd>협업 방식: <strong>{collaborationLabels[member.collaborationMode]}</strong></dd>
              </div>
              <div>
                <dt aria-hidden="true">◷</dt>
                <dd>주요 활동 시간: <strong>{member.activeTimes.map((time) => activeTimeLabels[time]).join(", ")}</strong></dd>
              </div>
              <div>
                <dt aria-hidden="true">♙</dt>
                <dd>팀 구인 여부: <strong className="member-profile-card__available">{member.lookingForTeam ? "팀 구하는 중" : "팀 구인 중 아님"}</strong></dd>
              </div>
            </dl>
            <button
              className="member-page__button member-page__button--primary member-profile-card__invite"
              onClick={() => setIsInviteOpen(true)}
              disabled={!member.lookingForTeam}
              type="button"
            >
              내 프로젝트에 초대
            </button>
          </aside>

          <div className="member-detail__sections">
            <section className="member-info-panel">
              <div className="member-info-panel__heading">
                <h2>학습 이력</h2>
                <span>총 {member.totalScore}점 · {member.level}</span>
              </div>
              <ul className="learning-history">
                {member.certificates.map((certificate) => ( 
                  <li key={certificate}>
                    <span className="learning-history__icon" aria-hidden="true">
                      🏅
                    </span>
                    <span className="learning-history__title">
                      {certificateLabels[certificate] ?? certificate}
                    </span>
                    <span className="learning-history__category">자격증</span>
                    <strong>보유</strong>
                  </li>
                ))}
                {member.awardCount > 0 && (
                  <li>
                    <span className="learning-history__icon" aria-hidden="true">🏆</span>
                    <span className="learning-history__title">대회 수상</span>
                    <span className="learning-history__category">수상 이력</span>
                    <strong>{member.awardCount}회</strong>
                  </li>
                )}
                <li>
                  <span className="learning-history__icon" aria-hidden="true">📌</span>
                  <span className="learning-history__title">프로젝트 완료</span>
                  <span className="learning-history__category">완료 이력</span>
                  <strong>{member.projectCount}개</strong>
                </li>
              </ul>
            </section>

            <section className="member-info-panel">
              <h2>자기소개</h2>
              <p className="member-bio">{member.intro}</p>
            </section>

            <section className="member-info-panel">
              <h2>보유 자격증</h2>
              <div className="member-tags">
                {member.certificates.length ? member.certificates.map((certificate) => (
                  <span className="member-tag" key={certificate}>
                    {certificateLabels[certificate] ?? certificate}
                  </span>
                )) : <p className="member-detail__muted">등록된 자격증이 없습니다.</p>}
              </div>
            </section>

            <section className="member-info-panel">
              <h2>포트폴리오</h2>
              {member.portfolioUrl ? (
                <a
                  className="member-portfolio-link"
                  href={member.portfolioUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {member.portfolioUrl}
                </a>
              ) : (
                <p className="member-detail__muted member-portfolio-empty">
                  등록된 포트폴리오가 없습니다.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
      {isInviteOpen && (
        <InviteModal member={member} onClose={() => setIsInviteOpen(false)} onInvite={inviteToProject} />
      )}
    </main>
  );
}

function normalizeProfile(data = {}) {
  const profile = data.profile ?? {};
  const learning = data.learning ?? {};
  const split = (value) => Array.isArray(value) ? value : String(value ?? "").split(",").filter(Boolean);
  return {
    id: Number(data.id),
    nickname: data.nickname,
    level: data.level ?? learning.level ?? "STARTER",
    totalScore: Number(data.totalScore ?? learning.totalScore ?? 0),
    intro: profile.intro ?? "소개가 등록되지 않았습니다.",
    collaborationMode: profile.collaborationMode ?? "ANY",
    activeTimes: split(profile.activeTimes),
    lookingForTeam: Boolean(profile.lookingForTeam),
    portfolioUrl: profile.portfolioUrl,
    certificates: split(learning.certificates),
    awardCount: Number(learning.awardCount ?? 0),
    projectCount: Number(learning.projectCount ?? 0),
  };
}
