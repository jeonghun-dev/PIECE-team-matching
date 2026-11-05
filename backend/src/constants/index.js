// 공통 상수 - schema.sql ENUM과 반드시 일치
const LEVEL = Object.freeze({
  STARTER: "STARTER",
  BUILDER: "BUILDER",
  ACHIEVER: "ACHIEVER",
});

const PROJECT_STATUS = Object.freeze({
  OPEN: "OPEN",     // 모집중
  CLOSED: "CLOSED", // 모집완료
});

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

module.exports = { LEVEL, PROJECT_STATUS, REQUEST_TYPE, REQUEST_STATUS };