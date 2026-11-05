const questionRepository = require("../repositories/questionRepository");

const { getPagination, toPageResponse } = require("../utils/pagination");

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

async function list(query) {
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

  const total = await questionRepository.count(keyword);
  const items = await questionRepository.findPage(keyword, paging.limit, paging.offset);
  return toPageResponse(items, total, paging);
}

module.exports = { list };
