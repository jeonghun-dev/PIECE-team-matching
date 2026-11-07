import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

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

function MemberShell({ children }) {
  return <div className="member-app">{children}</div>;
}

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

function MemberHeader({ activeItem }) {
  return (
    <header className="member-header">
      <div className="member-header__inner">
        <Link aria-label="PIECE 홈" className="member-brand" to="/">
          <span className="member-brand__icon" aria-hidden="true">✣</span>
          <span>PIECE</span>
        </Link>
        <nav aria-label="주요 메뉴" className="member-nav">
          <NavLink to="/projects">모집 게시판</NavLink>
          <NavLink to="/questions">질문 게시판</NavLink>
          <NavLink
            className={activeItem === "members" ? "is-current" : ""}
            to="/members"
          >
            팀원 찾기
          </NavLink>
          <NavLink to="/requests">
            요청함 <span className="member-request-count">3</span>
          </NavLink>
        </nav>
        <div className="member-header__actions">
          <Link className="button button--primary header-create-button" to="/projects/new">
            + 모집 글 작성
          </Link>
          <Link aria-label="요청함 알림" className="member-notification" to="/requests">
            ♧<span aria-hidden="true" />
          </Link>
          <span className="member-header__avatar" aria-hidden="true">성</span>
          <Link className="member-mypage-link" to="/mypage">마이페이지</Link>
        </div>
      </div>
    </header>
  );
}

function MemberFooter() {
  return <footer className="member-footer">PIECE · 6팀 DevMates</footer>;
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
      className="invite-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="invite-title"
        aria-modal="true"
        className="invite-dialog"
        role="dialog"
      >
        <div className="invite-dialog__heading">
          <h2 id="invite-title">프로젝트에 초대하기</h2>
          <button aria-label="닫기" className="invite-close" onClick={onClose} type="button">×</button>
        </div>
        <p className="invite-description">
          <strong>{member.nickname}</strong> 님을 초대할 모집 글을 선택하세요
        </p>

        <div aria-label="초대할 프로젝트" className="invite-projects">
          {projects
            .filter((project) => project.status === "OPEN")
            .map((project) => (
            <label
              className={`invite-project${selectedProjectId === String(project.id) ? " is-selected" : ""}`}
              key={project.id}
            >
              <input
                checked={selectedProjectId === String(project.id)}
                name="invite-project"
                onChange={() => setSelectedProjectId(String(project.id))}
                type="radio"
                value={project.id}
              />
              <span className="invite-project__copy">
                <strong>{project.title}</strong>
                <small>
                  {project.memberCount} / {project.capacity}명 · 마감 {project.deadline}
                </small>
              </span>
              <span className="member-level">{project.targetLevel}</span>
            </label>
            ))}
        </div>

        <label className="invite-message-label" htmlFor="invite-message">
          초대 메시지 <span>(선택)</span>
        </label>
        <textarea
          id="invite-message"
          maxLength={300}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          value={message}
        />
        {notice && <p className="invite-notice" role="status">{notice}</p>}
        <div className="invite-dialog__actions">
          <button className="button button--muted" onClick={onClose} type="button">취소</button>
          <button
            className="button button--primary"
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
  MemberFooter,
  MemberHeader,
  MemberMark,
  MemberShell,
};
