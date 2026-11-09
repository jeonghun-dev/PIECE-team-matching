const recruitmentService = require("../services/recruitmentService");
const { sendSuccess } = require("../utils/response");

// 참여 요청 생성
const apply = async (req, resp, next) => {
  try {
    const result = await recruitmentService.apply(req.user, req.params.id);

    return sendSuccess(resp, result, "참여 요청을 보냈습니다.", 201);
  } catch (error) {
    next(error);
  }
};

// 프로젝트 초대 요청 생성
const invite = async (req, resp, next) => {
  try {
    const result = await recruitmentService.invite(
      req.user,
      req.params.id,
      req.body,
    );
    return sendSuccess(resp, result, "초대 요청을 보냈습니다.", 201);
  } catch (error) {
    next(error);
  }
};

// 모집 글 작성자 전용 대기 지원자 목록 조회
const listApplicants = async (req, resp, next) => {
  try {
    const result = await recruitmentService.listApplicants(
      req.user,
      req.params.id,
    );

    return sendSuccess(resp, result, "지원자 목록을 조회했습니다.");
  } catch (error) {
    next(error);
  }
};

// 참여, 초대 요청 수락 (받은 사람)
const accept = async (req, resp, next) => {
  try {
    const result = await recruitmentService.accept(req.user, req.params.id);

    return sendSuccess(resp, result, "요청을 수락했습니다.");
  } catch (error) {
    next(error);
  }
};

// 참여, 초대 요청 거절 (받은 사람)
const reject = async (req, resp, next) => {
  try {
    const result = await recruitmentService.reject(req.user, req.params.id);

    return sendSuccess(resp, result, "요청을 거절했습니다.");
  } catch (error) {
    next(error);
  }
};

// 보낸 요청 취소
const cancel = async (req, resp, next) => {
  try {
    const result = await recruitmentService.cancel(req.user, req.params.id);
    return sendSuccess(resp, result, "요청을 취소했습니다.");
  } catch (error) {
    next(error);
  }
};

// 현재 팀원 목록 조회
const listMembers = async (req, resp, next) => {
  try {
    const result = await recruitmentService.listMembers(
      req.user,
      req.params.id,
    );

    return sendSuccess(resp, result, "팀원 목록을 조회했습니다.");
  } catch (error) {
    next(error);
  }
};

// 팀원 제외
const removeMember = async (req, resp, next) => {
  try {
    const result = await recruitmentService.removeMember(
      req.user,
      req.params.id,
      req.params.userId,
    );

    return sendSuccess(resp, result, "팀원을 제외했습니다.");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  apply,
  invite,
  listApplicants,
  accept,
  reject,
  cancel,
  listMembers,
  removeMember,
};
