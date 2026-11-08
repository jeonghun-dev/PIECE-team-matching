/**
 * LearningHistory 도메인 모델 (DB: users 테이블 학습 이력·점수·레벨 컬럼)
 * 담당: 박도영
 * 구분: 필수, 추가 기능 (회원가입 초기 이력 저장: 필수 / 학습 수준 확인 및 이력 수정: 추가 기능)
 */

// MySQL SET 문자열을 자격증 배열로 변환
const parseSet = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

// 자격증 배열을 MySQL SET 컬럼 문자열로 변환
const toSetString = (values) => {
  if (!values) return '';
  const list = Array.isArray(values) ? values : parseSet(values);
  return [...new Set(list)].join(',');
};

// JSON 직렬화 함수
const toJSON = (history) => ({
  certificates: history.certificates,
  awardCount: history.awardCount,
  projectCount: history.projectCount,
  totalScore: history.totalScore,
  level: history.level,
});

// 학습 이력 객체 팩토리 함수
const createLearningHistory = ({
  certificates = [],
  awardCount = 0,
  projectCount = 0,
  totalScore = 0.0,
  level = 'STARTER',
} = {}) => {
  const history = {
    certificates: Array.isArray(certificates) ? certificates : parseSet(certificates),
    awardCount: Number(awardCount || 0),
    projectCount: Number(projectCount || 0),
    totalScore: Number(totalScore || 0.0),
    level: level || 'STARTER', // 'STARTER' | 'BUILDER' | 'ACHIEVER'
    toJSON() {
      return toJSON(this);
    },
  };
  return history;
};

// DB row(snake_case)를 LearningHistory 모델(camelCase)로 변환
const fromRow = (row) => {
  if (!row) return null;
  return createLearningHistory({
    certificates: parseSet(row.certificates),
    awardCount: Number(row.award_count ?? row.awardCount ?? 0),
    projectCount: Number(row.project_count ?? row.projectCount ?? 0),
    totalScore: Number(row.total_score ?? row.totalScore ?? 0.0),
    level: row.level || 'STARTER',
  });
};

module.exports = {
  createLearningHistory,
  parseSet,
  toSetString,
  fromRow,
  toJSON,
};