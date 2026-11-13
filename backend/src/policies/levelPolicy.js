/**
 * LevelPolicy: 비전공자 취준생 맞춤형 학습 점수 및 3단계 레벨 산정 정책
 * 담당: 박도영
 * 구분: 필수, 추가 기능 (회원가입 시 초기 레벨 산정: 필수 / 학습 수준 상세 조회 및 이력 수정 시 갱신: 추가 기능)
 *
 * [배점 기준]
 * - 자격증(6종 SET):
 *   ENGINEER(정보처리기사): 2.0점
 *   INDUSTRIAL(정보처리산업기사): 1.0점
 *   SQLD(SQLD): 1.0점
 *   LINUX(리눅스마스터): 1.0점
 *   PROGRAMMING(프로그래밍기능사): 0.5점
 *   ADSP(ADsP): 0.5점
 * - 대회 수상(awardCount): 1회당 3.0점 (중복 가능)
 * - 프로젝트 완료(projectCount): 1개당 1.5점, 최대 3개(4.5점)까지만 반영
 * - 레벨 구간:
 *   STARTER: 0 ~ 2.0점
 *   BUILDER: 2.5 ~ 7.0점
 *   ACHIEVER: 7.5점 이상
 */

const SCORE_RULES = Object.freeze({
  CERTIFICATES: Object.freeze({
    ENGINEER: 2.0,      // 정보처리기사
    INDUSTRIAL: 1.0,    // 정보처리산업기사
    SQLD: 1.0,          // SQLD
    LINUX: 1.0,         // 리눅스마스터
    PROGRAMMING: 0.5,   // 프로그래밍기능사
    ADSP: 0.5,          // ADsP
  }),
  AWARD_UNIT_SCORE: 3.0,
  MAX_AWARD_COUNT_FOR_SCORE: 10,
  PROJECT_UNIT_SCORE: 1.5,
  MAX_PROJECT_COUNT_FOR_SCORE: 3,
  LEVEL_THRESHOLDS: Object.freeze({
    ACHIEVER_MIN: 7.5,
    BUILDER_MIN: 2.5,
  }),
});


// history : 소유 자격증, 수상횟수, 프로젝트 수에 대한 => 학습 레벨 도출
const calculate = (history = {}) => {
  const rawCerts = Array.isArray(history.certificates)    // array 인지 확인 -> JS 객체로 사용
    ? history.certificates    // FE 에서 JSON으로 보내면 .json으로 받으므로 array 형태
    : typeof history.certificates === 'string' && history.certificates.trim() !== ''  // DB 에선 string으로 오기 때문
      ? history.certificates.split(',').map((c) => c.trim())
      : [];

  // 중복 자격증 제거 후 정해진 6종 배점 합산
  const uniqueCerts = [...new Set(rawCerts.filter(Boolean))]; // Set : 중복 제거하는, '...' : 스프레드 문법 -> array로 변환
  const certificateScore = uniqueCerts.reduce((sum, certCode) => {
    const point = SCORE_RULES.CERTIFICATES[certCode] ?? 0;
    return sum + point;
  }, 0);

  const awardCount = Math.min(
    SCORE_RULES.MAX_AWARD_COUNT_FOR_SCORE,
    Math.max(0, Number.parseInt(history.awardCount ?? 0, 10) || 0)
  );
  const projectCount = Math.max(0, Number.parseInt(history.projectCount ?? 0, 10) || 0);

  const awardScore = awardCount * SCORE_RULES.AWARD_UNIT_SCORE;
  const cappedProjects = Math.min(projectCount, SCORE_RULES.MAX_PROJECT_COUNT_FOR_SCORE);
  const projectScore = cappedProjects * SCORE_RULES.PROJECT_UNIT_SCORE;

  const totalScore = Number((certificateScore + awardScore + projectScore).toFixed(1));

  let level = 'STARTER';
  if (totalScore >= SCORE_RULES.LEVEL_THRESHOLDS.ACHIEVER_MIN) {
    level = 'ACHIEVER';
  } else if (totalScore >= SCORE_RULES.LEVEL_THRESHOLDS.BUILDER_MIN) {
    level = 'BUILDER';
  }

  return {
    certificates: uniqueCerts,
    awardCount,
    projectCount,
    certificateScore: Number(certificateScore.toFixed(1)),
    awardScore: Number(awardScore.toFixed(1)),
    projectScore: Number(projectScore.toFixed(1)),
    totalScore,
    level,
  };
}

module.exports = { calculate, SCORE_RULES };