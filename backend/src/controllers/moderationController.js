const moderationService = require("../services/moderationService");
const { sendSuccess } = require("../utils/response");

// 신고 접수
const report = async (req, resp, next) => {
  try {
    const result = await moderationService.report(req.user, req.body);

    return sendSuccess(resp, result, "신고가 접수되었습니다.", 201);
  } catch (error) {
    next(error);
  }
};

// 관리자: 전체 회원 목록
const listUsers = async (req, resp, next) => {
  try {
    const result = await moderationService.listUsers(req.user, req.query);

    return sendSuccess(resp, result, "회원 목록을 조회했습니다.");
  } catch (error) {
    next(error);
  }
};

// 관리자: 회원 활동 저지
const suspend = async (req, resp, next) => {
  try {
    const result = await moderationService.suspend(req.user, req.params.id);

    return sendSuccess(resp, result, "회원 활동을 정지했습니다.");
  } catch (error) {
    next(error);
  }
};

// 관리자: 회원 활동 정지 해제
const unsuspend = async (req, resp, next) => {
  try {
    const result = await moderationService.unsuspend(req.user, req.params.id);

    return sendSuccess(resp, result, "회원 활동 정지를 해제했습니다.");
  } catch (error) {
    next(error);
  }
};

// 관리자: 신고 목록
const listReports = async (req, resp, next) => {
  try {
    const result = await moderationService.listReports(req.user, req.query);

    return sendSuccess(resp, result, "신고 목록을 조회했습니다.");
  } catch (error) {
    next(error);
  }
};

// 관리자: 신고 처리
const resolveReport = async (req, resp, next) => {
  try {
    const result = await moderationService.resolveReport(
      req.user,
      req.params.id,
      req.body?.status,
    );

    return sendSuccess(resp, result, "신고를 처리했습니다.");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  report,
  listUsers,
  suspend,
  unsuspend,
  listReports,
  resolveReport,
};
