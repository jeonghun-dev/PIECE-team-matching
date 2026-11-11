// 공통 번호 검사 유틸
const { createError } = require("./createError");

// URL이나 본문으로 받은 번호를 1 이상의 정수로 바꾸기
// 잘못된 값이면 400 에러
function parseId(value, message) {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id < 1) {
    throw createError(400, message);
  }

  return id;
}

module.exports = { parseId };