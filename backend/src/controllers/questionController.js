const questionService = require("../services/questionService");

const { sendSuccess } = require("../utils/response");

async function list(req, res, next) {
  try {
    const data = await questionService.list(req.query);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

module.exports = { list };
