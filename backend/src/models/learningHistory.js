/**
 * LearningHistory 도메인 모델 (DB: users 테이블 학습 이력·점수·레벨 컬럼)
 * 담당: 박도영
 * 구분: 필수, 추가 기능 (회원가입 초기 이력 저장: 필수 / 학습 수준 확인 및 이력 수정: 추가 기능)
 */
class LearningHistory {
  // 필수, 추가 기능: 학습 이력 및 레벨 속성 초기화
  constructor({
    certificates = [],
    awardCount = 0,
    projectCount = 0,
    totalScore = 0.0,
    level = 'STARTER',
  } = {}) {
    this.certificates = Array.isArray(certificates)
      ? certificates
      : LearningHistory.parseSet(certificates);
    this.awardCount = Number(awardCount || 0);
    this.projectCount = Number(projectCount || 0);
    this.totalScore = Number(totalScore || 0.0);
    this.level = level || 'STARTER'; // 'STARTER' | 'BUILDER' | 'ACHIEVER'
  }

  // 필수, 추가 기능: MySQL SET 문자열을 자격증 배열로 변환
  static parseSet(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  // 필수, 추가 기능: 자격증 배열을 MySQL SET 컬럼 문자열로 변환
  static toSetString(values) {
    if (!values) return '';
    const list = Array.isArray(values) ? values : LearningHistory.parseSet(values);
    return [...new Set(list)].join(',');
  }

  // 필수, 추가 기능: DB row(snake_case)를 LearningHistory 모델(camelCase)로 변환
  static fromRow(row) {
    if (!row) return null;
    return new LearningHistory({
      certificates: LearningHistory.parseSet(row.certificates),
      awardCount: Number(row.award_count ?? row.awardCount ?? 0),
      projectCount: Number(row.project_count ?? row.projectCount ?? 0),
      totalScore: Number(row.total_score ?? row.totalScore ?? 0.0),
      level: row.level || 'STARTER',
    });
  }

  // 필수, 추가 기능: JSON 응답용 객체 반환
  toJSON() {
    return {
      certificates: this.certificates,
      awardCount: this.awardCount,
      projectCount: this.projectCount,
      totalScore: this.totalScore,
      level: this.level,
    };
  }
}

module.exports = LearningHistory;
