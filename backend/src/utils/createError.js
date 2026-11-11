// 공통 에러 생성 유틸

// 상태 코드와 메시지를 가진 에러 만들기
function createError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

module.exports = { createError };