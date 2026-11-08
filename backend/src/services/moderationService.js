// 신고, 관리자 기능 업무 규칙
const moderationRepository = require("../repositories/moderationRepository");
const {
  REPORT_TARGET_TYPE,
  REPORT_REASON,
  REPORT_STATUS,
} = require("../constants");

const DETAIL_MAX_LENGTH = 500;

// 공통 에러 처리 미들웨어에 전달할 오류 생성
const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

// 신고 요청 본문 검사 후 정리된 값 반환
const parseReportInput = (input) => {
  const targetType = input?.targetType;
  const reason = input?.reason;
  const targetId = Number(input?.targetId);

  if (!Object.values(REPORT_TARGET_TYPE).includes(targetType)) {
    throw createError(400, "신고 대상 종류가 올바르지 않습니다.");
  }

  if (!Number.isSafeInteger(targetId) || targetId < 1) {
    throw createError(400, "신고 대상 번호가 올바르지 않습니다.");
  }

  if (!Object.values(REPORT_REASON).includes(reason)) {
    throw createError(400, "신고 사유가 올바르지 않습니다.");
  }

  // 상세 내용은 선택 입력, 비어 있으면 null로 저장
  let detail = input?.detail ?? null;

  if (detail !== null) {
    if (typeof detail !== "string") {
      throw createError(400, "상세 내용 형식이 올바르지 않습니다.");
    }

    detail = detail.trim();

    if (detail.length > DETAIL_MAX_LENGTH) {
      throw createError(
        400,
        `상세 내용은 ${DETAIL_MAX_LENGTH}자 이하로 입력해 주세요.`,
      );
    }

    if (detail === "") {
      detail = null;
    }
  }

  return { targetType, targetId, reason, detail };
};

// 신고 접수
const report = async (actor, input) => {
  if (!actor?.id) {
    throw createError(401, "로그인이 필요합니다.");
  }

  const { targetType, targetId, reason, detail } = parseReportInput(input);

  const target = await moderationRepository.findTarget(targetType, targetId);

  if (!target) {
    throw createError(404, "신고 대상을 찾을 수 없습니다.");
  }

  if (target.authorId === actor.id) {
    throw createError(403, "본인이 작성한 글은 신고할 수 없습니다.");
  }

  let reportId;

  try {
    reportId = await moderationRepository.saveReport({
      reporterId: actor.id,
      targetType,
      targetId,
      reason,
      detail,
    });
  } catch (error) {
    // uk_reports_once: 같은 대상은 한 사람당 1회만 신고
    if (error.code === "ER_DUP_ENTRY") {
      throw createError(409, "이미 신고한 대상입니다.");
    }

    throw error;
  }

  return {
    id: reportId,
    targetType,
    targetId,
    reason,
    detail,
    status: REPORT_STATUS.PENDING,
  };
};

module.exports = {
  report,
};
