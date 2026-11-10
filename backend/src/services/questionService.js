const questionRepository = require("../repositories/questionRepository")
const pool = require("../config/db")

const { getPagination, toPageResponse } = require("../utils/pagination");

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

// 질문 등록에 필요한 제목과 본문을 확인하는 함수이다.
function validateQuestionInput(input) {
  if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input)
  ) {
    badRequest("질문 제목과 내용을 입력해 주세요.");
  }

  if (
      typeof input.title !== "string" ||
      typeof input.content !== "string"
  ) {
    badRequest("제목과 내용은 문자열이어야 합니다.");
  }

  const title = input.title.trim();
  const content = input.content.trim();

  if (
      title.length === 0 ||
      content.length === 0
  ) {
    badRequest("제목과 내용을 입력해 주세요.");
  }

  if (title.length > 200) {
    badRequest("제목은 200자 이하여야 합니다.");
  }

  if (content.length > 2000) {
    badRequest("내용은 2000자 이하여야 합니다.");
  }

  return {
    title,
    content
  };
}

// 로그인한 사용자가 작성한 일반 질문을 저장하는 함수이다.
async function create(actor, input) {
  // 작성자 번호는 인증된 사용자 정보에서 가져오는 값이다.
  if (!actor || !actor.id) {
    const error = new Error("로그인이 필요합니다.");
    error.status = 401;
    throw error;
  }

  const questionInput = validateQuestionInput(input);

  const questionId = await questionRepository.save({
    authorId: actor.id,
    title: questionInput.title,
    content: questionInput.content
  });

  return {
    id: questionId
  };
}

// 모집 글에 질문을 등록한다.
async function createForProject(actor, projectId, input) {
  if (!actor || !actor.id) {
    const error = new Error("로그인이 필요합니다.");
    error.status = 401;
    throw error;
  }

  if (
      typeof projectId !== "string" ||
      !/^[1-9]\d*$/.test(projectId) ||
      !Number.isSafeInteger(Number(projectId))
  ) {
    badRequest("모집 글 번호는 유효한 양의 정수여야 합니다.");
  }

  const numericProjectId = Number(projectId);
  const questionInput = validateQuestionInput(input);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const project = await questionRepository.findProjectForUpdate(
        connection,
        numericProjectId
    );

    if (!project) {
      const error = new Error("모집 글을 찾을 수 없습니다.");
      error.status = 404;
      throw error;
    }

    const questionId = await questionRepository.saveForProject(
        connection,
        {
          authorId: actor.id,
          projectId: numericProjectId,
          title: questionInput.title,
          content: questionInput.content
        }
    );

    await connection.commit();

    return {
      id: questionId
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// 모집 글에 달린 질문 목록을 조회한다.
async function listForProject(actor, projectId) {
  if (!actor || !actor.id) {
    const error = new Error("로그인이 필요합니다.");
    error.status = 401;
    throw error;
  }

  if (
      typeof projectId !== "string" ||
      !/^[1-9]\d*$/.test(projectId) ||
      !Number.isSafeInteger(Number(projectId))
  ) {
    badRequest("모집 글 번호는 유효한 양의 정수여야 합니다.");
  }

  const numericProjectId = Number(projectId);

  const projectExists = await questionRepository.existsProject(
      numericProjectId
  );

  if (!projectExists) {
    const error = new Error("모집 글을 찾을 수 없습니다.");
    error.status = 404;
    throw error;
  }

  const questions = await questionRepository.findByProjectId(
      numericProjectId
  );

  return questions;
}

async function list(query) {
  // 빈 해결 상태는 조건 생략과 동일하게 전체 조회로 처리한다.
  // 정렬 기준이 없거나 빈 문자열이면 최신순으로 조회한다.
  const sort =
    query.sort === "" || query.sort === undefined
      ? "latest"
      : query.sort;
  const status = query.status === "" ? undefined : query.status;

  if (
    status !== undefined &&
    !["solved", "unsolved"].includes(status)
  ) {
    badRequest("해결 상태가 올바르지 않습니다.");
  }

  // 정렬 기준 검사
  if (!["latest", "views", "answers"].includes(sort)) {
    badRequest("정렬 기준이 올바르지 않습니다.");
  }
  if (query.keyword !== undefined && typeof query.keyword !== "string") {
    badRequest("검색어는 문자열이어야 합니다.");
  }
  const keyword = (query.keyword ?? "").trim();
  if (keyword.length > 100) badRequest("검색어는 100자 이하여야 합니다.");

  // 페이지 기본값·최대 크기·응답 형태는 팀 공통 유틸을 따르는 구조이다.
  const paging = getPagination(query);
  if (!Number.isSafeInteger(paging.page) || !Number.isSafeInteger(paging.offset)) {
    badRequest("페이지 범위가 너무 큽니다.");
  }

  const total = await questionRepository.count(
    keyword,
    status
  );

  const items = await questionRepository.findPage(
    keyword,
    paging.limit,
    paging.offset,
    status,
    sort
  );
  return toPageResponse(
    items,
    total,
    paging
  );
}

// 일반 질문의 조회수를 증가시키고 상세 내용을 반환하는 함수이다.
async function detail(actor, id) {
  // 인증 미들웨어가 확인한 사용자 정보가 필요한 기능이다.
  if (!actor || !actor.id) {
    const error = new Error("로그인이 필요합니다.");
    error.status = 401;
    throw error;
  }

  if (
      typeof id !== "string" ||
      !/^[1-9]\d*$/.test(id) ||
      !Number.isSafeInteger(Number(id))
  ) {
    badRequest("질문 번호는 유효한 양의 정수여야 합니다.");
  }

  const questionId = Number(id);

  const affectedRows = await questionRepository.increaseViewCount(
      questionId
  );

  if (affectedRows === 0) {
    const error = new Error("질문을 찾을 수 없습니다.");
    error.status = 404;
    throw error;
  }

  const question = await questionRepository.findById(
      questionId
  );

  if (question === null) {
    const error = new Error("질문을 찾을 수 없습니다.");
    error.status = 404;
    throw error;
  }

  return question;
}

// 질문 작성자만 제목과 내용을 수정할 수 있도록 검사하는 함수이다.
async function edit(actor, id, input) {
  if (!actor || !actor.id) {
    const error = new Error("로그인이 필요합니다.");
    error.status = 401;
    throw error;
  }

  if (
      typeof id !== "string" ||
      !/^[1-9]\d*$/.test(id) ||
      !Number.isSafeInteger(Number(id))
  ) {
    badRequest("질문 번호는 유효한 양의 정수여야 합니다.");
  }

  const questionId = Number(id);
  const questionInput = validateQuestionInput(input);

  const question = await questionRepository.findForModification(
      questionId
  );

  if (question === null) {
    const error = new Error("질문을 찾을 수 없습니다.");
    error.status = 404;
    throw error;
  }

  if (String(question.authorId) !== String(actor.id)) {
    const error = new Error("작성자만 수정할 수 있습니다.");
    error.status = 403;
    throw error;
  }

  const affectedRows = await questionRepository.update(
      questionId,
      {
        authorId: actor.id,
        title: questionInput.title,
        content: questionInput.content
      }
  );

  if (affectedRows === 0) {
    const error = new Error("질문을 찾을 수 없습니다.");
    error.status = 404;
    throw error;
  }

  return {
    id: questionId
  };
}



// 작성자 권한을 확인하고 일반 질문을 소프트 삭제하는 함수이다.
async function remove(actor, id) {
  if (!actor || !actor.id) {
    const error = new Error("로그인이 필요합니다.");
    error.status = 401;
    throw error;
  }

  if (
    typeof id !== "string" ||
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(Number(id))
  ) {
    badRequest("질문 번호는 유효한 양의 정수여야 합니다.");
  }

  const questionId = Number(id);
  const question = await questionRepository.findForModification(
      questionId
  );

  if (question === null) {
    const error = new Error("질문을 찾을 수 없습니다.");
    error.status = 404;
    throw error;
  }

  if (String(question.authorId) !== String(actor.id)) {
    const error = new Error("작성자만 삭제할 수 있습니다.");
    error.status = 403;
    throw error;
  }

  const affectedRows = await questionRepository.softDelete(
    questionId,
    actor.id
  );

  if (affectedRows === 0) {
    const error = new Error("질문을 찾을 수 없습니다.");
    error.status = 404;
    throw error;
  }

  return {
    id: questionId
  };
}

module.exports = {
  listForProject,
  createForProject,
  list,
  create,
  detail,
  edit,
  remove
};
