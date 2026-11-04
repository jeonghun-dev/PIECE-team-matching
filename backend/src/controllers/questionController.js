const service = require("../services/questionService");

// 요청값을 Service에 전달하고 결과를 공통 JSON 형식으로 응답합니다.
function createQuestionController(questionService) {
  return {
    async list(req, res, next) {
      try {
        const data = await questionService.list(req.query);
        res.status(200).json({ success: true, data, message: null });
      } catch (error) {
        next(error);
      }
    }
  };
}

module.exports = { ...createQuestionController(service), createQuestionController };
