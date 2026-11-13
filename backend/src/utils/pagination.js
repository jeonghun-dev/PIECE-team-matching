// 페이지네이션 유틸
// 응답 형식: { items, page, size, totalCount }

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 10;
const MAX_SIZE = 50; // 한 번에 너무 많이 가져오지 않도록 제한

// 문자열 → 1 이상의 정수로 변환. 값이 없으면 기본값, 잘못된 값이면 400 에러
const toPositiveInt = (value, defaultValue, name) => {
  if (value === undefined || value === "") return defaultValue;

  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) {
    const error = new Error(`${name}는 1 이상의 정수여야 합니다.`);
    error.status = 400;
    throw error;
  }
  return num;
};

// req.query에서 page, size를 꺼내 검사하고 LIMIT/OFFSET 값을 계산
const getPagination = (query) => {
  const page = toPositiveInt(query.page, DEFAULT_PAGE, "page");
  const size = Math.min(toPositiveInt(query.size, DEFAULT_SIZE, "size"), MAX_SIZE);
  const offset = (page - 1) * size;

  return { page, size, limit: size, offset };
};

// 조회 결과를 공통 페이지 응답 형식으로 만들기
const toPageResponse = (items, totalCount, { page, size }) => {
  return { items, page, size, totalCount };
};

module.exports = { getPagination, toPageResponse };