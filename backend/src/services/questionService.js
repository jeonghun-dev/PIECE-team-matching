const questionRepository = require("../repositories/questionRepository");

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function positiveInteger(value, defaultValue, name) {
  if (value === undefined) return defaultValue;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    badRequest(`${name}는 1 이상의 정수여야 합니다.`);
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number)) badRequest(`${name} 값이 너무 큽니다.`);
  return number;
}

async function list(query) {
  if (query.keyword !== undefined && typeof query.keyword !== "string") {
    badRequest("검색어는 문자열이어야 합니다.");
  }
  const keyword = (query.keyword ?? "").trim();
  if (keyword.length > 100) badRequest("검색어는 100자 이하여야 합니다.");

  // 기본 10개, 최대 100개는 팀과 조율할 임시 기준이다.
  const page = positiveInteger(query.page, 1, "page");
  const size = positiveInteger(query.size, 10, "size");
  if (size > 100) badRequest("size는 100 이하여야 합니다.");
  const offset = (page - 1) * size;
  if (!Number.isSafeInteger(offset)) badRequest("페이지 범위가 너무 큽니다.");

  const total = await questionRepository.count(keyword);
  const items = await questionRepository.findPage(keyword, size, offset);
  return {
    items,
    pagination: { page, size, total, totalPages: Math.ceil(total / size) }
  };
}

module.exports = { list };
