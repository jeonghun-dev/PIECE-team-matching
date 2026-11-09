import { useEffect, useState } from "react";
import { getMyOpenProjects } from "../../api/requests";

function MemberMark({ name, large = false }) {
  return (
    <span
      aria-hidden="true"
      className={`member-mark${large ? " member-mark--large" : ""}`}
    >
      {name?.slice(0, 1) || "?"}
    </span>
  );
}

function InviteModal({ member, onClose, onInvite }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [message, setMessage] = useState(
    `${member.nickname}님 프로필 보고 연락드려요! 같은 ${member.level} 레벨이라 함께하면 좋을 것 같습니다.`,
  );
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    getMyOpenProjects().then(({ data }) => {
      const items = data.data ?? [];
      if (active) {
        setProjects(items);
        setSelectedProjectId(items.length ? String(items[0].id) : "");
      }
    }).catch(() => {
      if (active) setNotice("내 모집 중인 프로젝트를 불러오지 못했습니다.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function submitInvite() {
    if (!selectedProjectId || submitting) return;
    setSubmitting(true);
    setNotice("");
    try {
      await onInvite(selectedProjectId, { userId: member.id, message: message.trim() || undefined });
      setNotice("초대 요청을 보냈습니다.");
    } catch (error) {
      setNotice(error.response?.data?.message || "초대 요청을 보내지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="member-invite__backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="invite-title"
        aria-modal="true"
        className="member-invite__dialog"
        role="dialog"
      >
        <div className="member-invite__heading">
          <h2 id="invite-title">프로젝트에 초대하기</h2>
          <button aria-label="닫기" className="member-invite__close" onClick={onClose} type="button">×</button>
        </div>
        <p className="member-invite__description">
          <strong>{member.nickname}</strong> 님을 초대할 모집 글을 선택하세요
        </p>

        <div aria-label="초대할 프로젝트" className="member-invite__projects">
          {projects
            .map((project) => (
            <label
              className={`member-invite__project${selectedProjectId === String(project.id) ? " member-invite__project--selected" : ""}`}
              key={project.id}
            >
              <input
                checked={selectedProjectId === String(project.id)}
                name="invite-project"
                onChange={() => setSelectedProjectId(String(project.id))}
                type="radio"
                value={project.id}
              />
              <span className="member-invite__project-copy">
                <strong>{project.title}</strong>
                <small>
                  {project.memberCount} / {project.capacity}명 · 마감 {String(project.deadline).slice(0, 10)}
                </small>
              </span>
              <span className="member-level">{project.targetLevel}</span>
            </label>
            ))}
        </div>

        <label className="member-invite__message-label" htmlFor="invite-message">
          초대 메시지 <span>(선택)</span>
        </label>
        <textarea
          id="invite-message"
          maxLength={500}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          value={message}
        />
        {loading && <p className="member-invite__notice" role="status">프로젝트 목록을 불러오는 중입니다.</p>}
        {!loading && !projects.length && <p className="member-invite__notice" role="status">초대할 수 있는 모집 중 프로젝트가 없습니다.</p>}
        {notice && <p className="member-invite__notice" role="status">{notice}</p>}
        <div className="member-invite__actions">
          <button className="member-page__button member-page__button--muted" onClick={onClose} type="button">취소</button>
          <button
            className="member-page__button member-page__button--primary"
            disabled={loading || submitting || !selectedProjectId}
            onClick={submitInvite}
            type="button"
          >
            {submitting ? "보내는 중..." : "초대 요청 보내기"}
          </button>
        </div>
      </section>
    </div>
  );
}

export {
  InviteModal,
  MemberMark,
};
