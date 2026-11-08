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

module.exports = {
  report,
};
