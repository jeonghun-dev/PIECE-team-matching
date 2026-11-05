const questionService = require("../services/questionService");



async function list(req, res, next) {
  try {
    const data = await questionService.list(req.query);
    res.status(200).json({
      success: true,
      data,
      message: null
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { list };
