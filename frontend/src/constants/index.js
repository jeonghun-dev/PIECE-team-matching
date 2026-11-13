// FE 공통 상수 
// 학습 레벨 
export const LEVEL = Object.freeze({
    STARTER: "STARTER",
    BUILDER: "BUILDER",
    ACHIEVER: "ACHIEVER",
});

export const LEVEL_OPTIONS = [
    { code: LEVEL.STARTER, label: "STARTER" },
    { code: LEVEL.BUILDER, label: "BUILDER" },
    { code: LEVEL.ACHIEVER, label: "ACHIEVER" },
];

// 협업 방식
export const COLLABORATION_MODE = Object.freeze({
    ONLINE: "ONLINE",
    OFFLINE: "OFFLINE",
    ANY: "ANY",
});

export const COLLABORATION_OPTIONS = [
    { code: COLLABORATION_MODE.ONLINE, label: "온라인" },
    { code: COLLABORATION_MODE.OFFLINE, label: "오프라인" },
    { code: COLLABORATION_MODE.ANY, label: "무관" },
];

// 주요 활동 시간 (여러 개 선택)
export const ACTIVE_TIME = Object.freeze({
    WEEKDAY_DAY: "WEEKDAY_DAY",
    WEEKDAY_NIGHT: "WEEKDAY_NIGHT",
    WEEKEND_AM: "WEEKEND_AM",
    WEEKEND_PM: "WEEKEND_PM",
});

export const ACTIVE_TIME_OPTIONS = [
    { code: ACTIVE_TIME.WEEKDAY_DAY, label: "평일 낮" },
    { code: ACTIVE_TIME.WEEKDAY_NIGHT, label: "평일 저녁" },
    { code: ACTIVE_TIME.WEEKEND_AM, label: "주말 오전" },
    { code: ACTIVE_TIME.WEEKEND_PM, label: "주말 오후" },
];

// 보유 자격증 
export const CERTIFICATE = Object.freeze({
    ENGINEER: "ENGINEER",
    INDUSTRIAL: "INDUSTRIAL",
    SQLD: "SQLD",
    LINUX: "LINUX",
    PROGRAMMING: "PROGRAMMING",
    ADSP: "ADSP",
});

export const CERTIFICATE_OPTIONS = [
    { code: CERTIFICATE.ENGINEER, label: "정보처리기사" },
    { code: CERTIFICATE.INDUSTRIAL, label: "정보처리산업기사" },
    { code: CERTIFICATE.SQLD, label: "SQLD" },
    { code: CERTIFICATE.LINUX, label: "리눅스마스터" },
    { code: CERTIFICATE.PROGRAMMING, label: "프로그래밍기능사" },
    { code: CERTIFICATE.ADSP, label: "ADsP" },
];

// 진행 방식
export const PROGRESS_MODE = Object.freeze({
    ONLINE: "ONLINE",
    OFFLINE: "OFFLINE",
    HYBRID: "HYBRID",
});

export const PROGRESS_MODE_OPTIONS = [
    { code: PROGRESS_MODE.ONLINE, label: "온라인" },
    { code: PROGRESS_MODE.OFFLINE, label: "오프라인" },
    { code: PROGRESS_MODE.HYBRID, label: "온·오프 병행" },
];

// 모집 상태 
export const PROJECT_STATUS = Object.freeze({
    OPEN: "OPEN",
    CLOSED: "CLOSED",
});

export const PROJECT_STATUS_LABEL = Object.freeze({
    OPEN: "모집중",
    CLOSED: "모집완료",
});

// 요청 종류
export const REQUEST_TYPE = Object.freeze({
    APPLY: "APPLY",
    INVITE: "INVITE",
});

export const REQUEST_TYPE_LABEL = Object.freeze({
    APPLY: "참여 요청",
    INVITE: "초대 요청",
});

// 요청 상태
export const REQUEST_STATUS = Object.freeze({
    PENDING: "PENDING",
    ACCEPTED: "ACCEPTED",
    REJECTED: "REJECTED",
    CANCELED: "CANCELED",
});

export const REQUEST_STATUS_LABEL = Object.freeze({
    PENDING: "대기",
    ACCEPTED: "수락",
    REJECTED: "거절",
    CANCELED: "취소",
});

// 권한
export const USER_ROLE = Object.freeze({
    USER: "USER",
    ADMIN: "ADMIN",
});

// 신고 사유
export const REPORT_REASON_OPTIONS = [
    { code: "ABUSE", label: "욕설" },
    { code: "AD", label: "광고" },
    { code: "PROMOTION", label: "외부 홍보" },
    { code: "ETC", label: "기타" },
];