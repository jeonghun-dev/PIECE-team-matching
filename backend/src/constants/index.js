// 공통 상수(schema.sql ENUM과 반드시 일치해야 함)

// 권한
const USER_ROLE = Object.freeze({
  USER: "USER",   // 일반 회원
  ADMIN: "ADMIN", // 관리자
});

// 회원 상태
const USER_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",       // 정상
  SUSPENDED: "SUSPENDED", // 활동 정지
});

// 학습 레벨
const LEVEL = Object.freeze({
  STARTER: "STARTER",
  BUILDER: "BUILDER",
  ACHIEVER: "ACHIEVER",
});

// 협업 방식
const COLLABORATION_MODE = Object.freeze({
  ONLINE: "ONLINE",   // 온라인
  OFFLINE: "OFFLINE", // 오프라인
  ANY: "ANY",         // 무관
});

// 주요 활동 시간
const ACTIVE_TIME = Object.freeze({
  WEEKDAY_DAY: "WEEKDAY_DAY",     // 평일 낮
  WEEKDAY_NIGHT: "WEEKDAY_NIGHT", // 평일 저녁
  WEEKEND_AM: "WEEKEND_AM",       // 주말 오전
  WEEKEND_PM: "WEEKEND_PM",       // 주말 오후
});

// 보유 자격증
const CERTIFICATE = Object.freeze({
  ENGINEER: "ENGINEER",       // 정보처리기사
  INDUSTRIAL: "INDUSTRIAL",   // 정보처리산업기사
  SQLD: "SQLD",               // SQLD
  LINUX: "LINUX",             // 리눅스마스터
  PROGRAMMING: "PROGRAMMING", // 프로그래밍기능사
  ADSP: "ADSP",               // ADsP
});

// 모집 상태
const PROJECT_STATUS = Object.freeze({
  OPEN: "OPEN",     // 모집중
  CLOSED: "CLOSED", // 모집완료
});


// 진행 방식 
const PROGRESS_MODE = Object.freeze({
  ONLINE: "ONLINE",   // 온라인
  OFFLINE: "OFFLINE", // 오프라인
  HYBRID: "HYBRID",   // 온·오프 병행
});

// 팀 내 역할
const MEMBER_ROLE = Object.freeze({
  LEADER: "LEADER", // 팀장 (모집 글 작성자)
  MEMBER: "MEMBER", // 팀원
});

// 요청 종류
const REQUEST_TYPE = Object.freeze({
  APPLY: "APPLY",   // 참여 요청
  INVITE: "INVITE", // 초대 요청
});

// 요청 상태
const REQUEST_STATUS = Object.freeze({
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  CANCELED: "CANCELED",
});

// 신고 대상 종류
const REPORT_TARGET_TYPE = Object.freeze({
  PROJECT: "PROJECT",   // 모집 글
  QUESTION: "QUESTION", // 질문
  ANSWER: "ANSWER",     // 답변
});

// 신고 사유 
const REPORT_REASON = Object.freeze({
  ABUSE: "ABUSE",         // 욕설
  AD: "AD",               // 광고
  PROMOTION: "PROMOTION", // 외부 홍보
  ETC: "ETC",             // 기타
});

// 신고 처리 상태 
const REPORT_STATUS = Object.freeze({
  PENDING: "PENDING",   // 처리 대기
  RESOLVED: "RESOLVED", // 조치 완료
  REJECTED: "REJECTED", // 반려
});

// 추천 목록에서 한 번에 노출할 항목 수
const RECOMMENDATION_LIMIT = 4;

module.exports = {
  USER_ROLE,
  USER_STATUS,
  LEVEL,
  COLLABORATION_MODE,
  ACTIVE_TIME,
  CERTIFICATE,
  PROJECT_STATUS,
  PROGRESS_MODE,
  MEMBER_ROLE,
  REQUEST_TYPE,
  REQUEST_STATUS,
  REPORT_TARGET_TYPE,
  REPORT_REASON,
  REPORT_STATUS,
  RECOMMENDATION_LIMIT,
};
