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

// 관리글: 모집 글 목록
const listProjects = async (req, resp, next) => {
  try {
    const result = await moderationService.listProjects(req.user, req.query);

    return sendSuccess(resp, result, "모집 글 목록을 조회했습니다.");
  } catch (error) {
    next(error);
  }
};

// 관리자: 모집 글 삭제
const removeProject = async (req, resp, next) => {
  try {
    const result = await moderationService.removeProject(
      req.user,
      req.params.id,
    );

    return sendSuccess(resp, result, "모집 글을 삭제했습니다.");
  } catch (error) {
    next(error);
  }
};

// 관리자: 질문, 답변 목록
const listQna = async (req, resp, next) => {
  try {
    const result = await moderationService.listQna(req.user, req.query);

    return sendSuccess(resp, result, "질문·답변 목록을 조회했습니다.");
  } catch (error) {
    next(error);
  }
};

// 관리자: 질문 삭제
const removeQuestion = async (req, resp, next) => {
  try {
    const result = await moderationService.removeQuestion(
      req.user,
      req.params.id,
    );

    return sendSuccess(resp, result, "질문을 삭제했습니다.");
  } catch (error) {
    next(error);
  }
};

// 관리자: 답변 삭제
const removeAnswer = async (req, resp, next) => {
  try {
    const result = await moderationService.removeAnswer(
      req.user,
      req.params.id,
    );

    return sendSuccess(resp, result, "답변을 삭제했습니다.");
  } catch (error) {
    next(error);
  }
};

// 관리자: 신고 대상 단위 처리
const resolveReportTarget = async (req, resp, next) => {
  try {
    const result = await moderationService.resolveReportTarget(
      req.user,
      req.params.targetType,
      req.params.targetId,
      req.body?.status,
    );

    return sendSuccess(resp, result, "신고를 처리했습니다.");
  } catch (error) {
    next(error);
  }
};

// 내가 신고한 대상 번호 목록
const myReports = async (req, resp, next) => {
  try {
    const result = await moderationService.myReports(req.user, req.query);

    return sendSuccess(resp, result);
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
  resolveReportTarget,
  myReports,
  listProjects,
  removeProject,
  listQna,
  removeQuestion,
  removeAnswer,
};
