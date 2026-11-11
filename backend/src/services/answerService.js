const answerRepository = require("../repositories/answerRepository");
const { createError } = require("../utils/createError");
const { parseId } = require("../utils/parseId");

async function list(actor, questionId) {
  if (!actor?.id) {
    throw createError(401, "로그인이 필요합니다.");
  }
  const id = parseId(questionId, "올바른 질문 번호가 필요합니다.");
  const question = await answerRepository.findQuestionById(id);

  if (!question) {
    throw createError(404, "질문을 찾을 수 없습니다.");
  }

  const answers = await answerRepository.findByQuestionId(id);

  // DB 값을 화면에서 쓰는 형태로 변환 (점수: 숫자, 채택 여부: true/false)
  return answers.map((answer) => ({
    ...answer,
    authorScore: Number(answer.authorScore),
    isAccepted: Number(answer.isAccepted) === 1,
  }));
}

async function create(actor, input) {
  if (!actor?.id) {
    throw createError(401, "로그인이 필요합니다.");
  }
  const questionId = parseId(input?.questionId, "올바른 질문 번호가 필요합니다.");
  if (typeof input?.content !== "string") {
    throw createError(400, "답변 내용을 입력해주세요.");
  }
  const content = input.content.trim();

  if (!content) {
    throw createError(400, "답변 내용은 공백일 수 없습니다.");
  }

  // TEXT column의 저장 한도 검사
  if (Buffer.byteLength(content, "utf8") > 65535) {
    throw createError(400, "답변 내용이 너무 깁니다.");
  }
  const question = await answerRepository.findQuestionById(questionId);

  if (!question) {
    throw createError(404, "질문을 찾을 수 없습니다.");
  }
  const answerId = await answerRepository.save({
    questionId,
    authorId: actor.id,
    content,
  });

  return { id: answerId };
}

async function edit(actor, answerId, input) {
  if (!actor?.id) {
    throw createError(401, "로그인이 필요합니다.");
  }
  const id = parseId(answerId, "올바른 답변 번호가 필요합니다.");
  if (typeof input?.content !== "string") {
    throw createError(400, "답변 내용을 입력해주세요.");
  }

  const content = input.content.trim();

  if (!content) {
    throw createError(400, "답변 내용은 공백일 수 없습니다.");
  }

  if (Buffer.byteLength(content, "utf8") > 65535) {
    throw createError(400, "답변 내용이 너무 깁니다.");
  }

  const answer = await answerRepository.findById(id);

  if (!answer) {
    throw createError(404, "답변을 찾을 수 없습니다.");
  }

  if (String(answer.author_id) !== String(actor.id)) {
    throw createError(403, "작성자만 수정할 수 있습니다.");
  }

  if (answer.content === content) {
    return { id };
  }

  const updatedCount = await answerRepository.update(id, {
    authorId: actor.id,
    content,
  });

  if (updatedCount === 0) {
    throw createError(409, "답변 상태가 변경되었습니다. 다시 확인해주세요.");
  }

  return { id };
}

async function remove(actor, answerId) {
  if (!actor?.id) {
    throw createError(401, "로그인이 필요합니다.");
  }

  const id = parseId(answerId, "올바른 답변 번호가 필요합니다.");

  return answerRepository.withTransaction(async (connection) => {
    const answer = await answerRepository.findByIdForUpdate(connection, id);

    if (!answer) {
      throw createError(404, "답변을 찾을 수 없습니다.");
    }
    if (String(answer.author_id) !== String(actor.id)) {
      throw createError(403, "작성자만 삭제할 수 있습니다.");
    }
    if (Number(answer.is_accepted) === 1) {
      throw createError(409, "채택된 답변은 삭제할 수 없습니다.");
    }

    const deletedCount = await answerRepository.softDelete(
      connection,
      id,
      actor.id,
    );

    if (deletedCount === 0) {
      throw createError(409, "답변 상태가 변경되었습니다. 다시 확인해주세요.");
    }

    return { id };
  });
}

async function accept(actor, answerId) {
  if (!actor?.id) {
    throw createError(401, "로그인이 필요합니다.");
  }

  const id = parseId(answerId, "올바른 답변 번호가 필요합니다.");

  const answer = await answerRepository.findById(id);

  if (!answer) {
    throw createError(404, "답변을 찾을 수 없습니다.");
  }

  const question = await answerRepository.findQuestionById(answer.question_id);

  if (!question) {
    throw createError(404, "질문을 찾을 수 없습니다.");
  }

  if (String(question.author_id) !== String(actor.id)) {
    throw createError(403, "질문 작성자만 채택할 수 있습니다.");
  }

  if (String(answer.author_id) === String(actor.id)) {
    throw createError(403, "본인이 작성한 답변은 채택할 수 없습니다.");
  }

  if (Number(question.is_solved) === 1) {
    throw createError(409, "이미 해결된 질문입니다.");
  }

  const acceptedCount = await answerRepository.acceptIfOpen(id, actor.id);

  if (acceptedCount === 0) {
    throw createError(409, "채택할 수 없는 상태입니다. 다시 확인해주세요.");
  }

  return { id };
}

module.exports = {
  list,
  create,
  edit,
  remove,
  accept,
};
