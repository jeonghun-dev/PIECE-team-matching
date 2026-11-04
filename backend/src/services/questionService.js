const repository = require("../repositories/questionRepository");

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function positiveInteger(value, fallback, name) {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    badRequest(`${name}는 1 이상의 정수여야 합니다.`);
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number)) badRequest(`${name} 값이 너무 큽니다.`);
  return number;
}

function createQuestionService(repo) {
  return {
    async list(query = {}) {
      // 미지원 조건을 조용히 무시하지 않고 입력 오류로 알립니다.
      for (const key of Object.keys(query)) {
        if (!["keyword", "page", "size"].includes(key)) badRequest(`지원하지 않는 조회 조건: ${key}`);
      }
      if (query.keyword !== undefined && typeof query.keyword !== "string") {
        badRequest("검색어는 문자열이어야 합니다.");
      }
      const keyword = (query.keyword ?? "").trim();
      if (keyword.length > 100) badRequest("검색어는 100자 이하여야 합니다.");
      // 팀 확정 전 임시 기준: 기본 10개, 최대 100개.
      const page = positiveInteger(query.page, 1, "page");
      const size = positiveInteger(query.size, 10, "size");
      if (size > 100) badRequest("size는 100 이하여야 합니다.");
      const offset = (page - 1) * size;
      if (!Number.isSafeInteger(offset)) badRequest("페이지 범위가 너무 큽니다.");
      const total = await repo.count(keyword);
      const items = offset >= total ? [] : await repo.findPage(keyword, size, offset);
      return { items, pagination: { page, size, total, totalPages: Math.ceil(total / size) } };
    }
  };
}

module.exports = { ...createQuestionService(repository), createQuestionService };
