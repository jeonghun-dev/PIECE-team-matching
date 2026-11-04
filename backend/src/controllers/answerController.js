const answerService = require("../services/answerService");

async function list(req, resp, next) {
  try {
    const answers = await answerService.list(req.user, req.params.id);

    const data = answers.map((answer) => ({
      id: answer.id,
      questionId: answer.question_id,
      authorId: answer.author_id,
      content: answer.content,
      createdAt: answer.created_at,
      updatedAt: answer.updated_at,
      authorNickname: answer.author_nickname,
      authorLevel: answer.author_level,
      isAccepted: Number(answer.is_accepted) === 1,
    }));

    return resp.status(200).json({
      success: true,
      data,
      message: null,
    });
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
    return resp.status(201).json({
      success: true,
      data,
      message: null,
    });
  } catch (error) {
    next(error);
  }
}

async function edit(req, resp, next) {
  try {
    const data = await answerService.edit(req.user, req.params.id, {
      content: req.body?.content,
    });

    return resp.status(200).json({
      success: true,
      data,
      message: null,
    });
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

    return resp.status(200).json({
      success: true,
      data,
      message: null,
    });
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
