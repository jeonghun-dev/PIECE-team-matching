const answerService = require("../services/answerService");
const { sendSuccess } = require("../utils/response");

// 컨트롤러는 요청 값을 꺼내 서비스에 넘기고 응답만 보냄 (데이터 변환은 서비스)
async function list(req, resp, next) {
  try {
    const data = await answerService.list(req.user, req.params.id);
    return sendSuccess(resp, data);
  } catch (error) {
    next(error);
  }
}

async function create(req, resp, next) {
  try {
    const data = await answerService.create(req.user, {
      questionId: req.params.id,
      content: req.body?.content,
    });
    return sendSuccess(resp, data, null, 201);
  } catch (error) {
    next(error);
  }
}

async function edit(req, resp, next) {
  try {
    const data = await answerService.edit(req.user, req.params.id, {
      content: req.body?.content,
    });
    return sendSuccess(resp, data);
  } catch (error) {
    next(error);
  }
}

async function remove(req, resp, next) {
  try {
    await answerService.remove(req.user, req.params.id);
    return resp.status(204).end();
  } catch (error) {
    next(error);
  }
}

async function accept(req, resp, next) {
  try {
    const data = await answerService.accept(req.user, req.params.id);
    return sendSuccess(resp, data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  create,
  edit,
  remove,
  accept,
};
