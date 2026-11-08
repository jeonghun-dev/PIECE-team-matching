import { useEffect, useState } from "react";

const projects = [
  {
    id: 1,
    title: "스터디 일정 공유 웹 서비스 - REST API 연습",
    memberCount: 2,
    capacity: 4,
    deadline: "11.15",
    targetLevel: "BUILDER",
    status: "OPEN",
  },
  {
    id: 2,
    title: "JSON 기반 맞춤 지도 API 서버",
    memberCount: 1,
    capacity: 3,
    deadline: "11.20",
    targetLevel: "BUILDER",
    status: "OPEN",
  },
];

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

function InviteModal({ member, onClose }) {
  const [selectedProjectId, setSelectedProjectId] = useState(String(projects[0].id));
  const [message, setMessage] = useState(
    `${member.nickname}님 프로필 보고 연락드려요! 같은 ${member.level} 레벨이라 함께하면 좋을 것 같습니다.`,
  );
  const [notice, setNotice] = useState("");

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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
            .filter((project) => project.status === "OPEN")
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
                  {project.memberCount} / {project.capacity}명 · 마감 {project.deadline}
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
          maxLength={300}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          value={message}
        />
        {notice && <p className="member-invite__notice" role="status">{notice}</p>}
        <div className="member-invite__actions">
          <button className="member-page__button member-page__button--muted" onClick={onClose} type="button">취소</button>
          <button
            className="member-page__button member-page__button--primary"
            onClick={() => setNotice("화면 시안입니다. 초대 요청은 아직 전송되지 않았어요.")}
            type="button"
          >
            초대 요청 보내기
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
