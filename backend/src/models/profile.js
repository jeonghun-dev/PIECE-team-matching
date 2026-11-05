/**
 * Profile 도메인 모델 (DB: users 테이블 기술 프로필 컬럼)
 * 담당: 박도영
 * 구분: 필수, 추가 기능 (회원가입 초기 프로필 입력: 필수 / 마이페이지 프로필 수정·팀원 상세 조회: 추가 기능)
 */
class Profile {
  // 필수, 추가 기능: 기술 프로필 속성 초기화
  constructor({
    intro = null,
    collaborationMode = 'ANY',
    activeTimes = [],
    lookingForTeam = true,
    portfolioUrl = null,
  } = {}) {
    this.intro = intro ?? null;
    this.collaborationMode = collaborationMode; // 'ONLINE' | 'OFFLINE' | 'ANY'
    this.activeTimes = Array.isArray(activeTimes)
      ? activeTimes
      : Profile.parseSet(activeTimes);
    this.lookingForTeam = Boolean(lookingForTeam);
    this.portfolioUrl = portfolioUrl || null;
  }

  // 필수, 추가 기능: MySQL SET 문자열('WEEKDAY_DAY,WEEKEND_AM')을 배열로 변환
  static parseSet(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  // 필수, 추가 기능: 배열을 MySQL SET 저장용 문자열로 변환
  static toSetString(values) {
    if (!values) return '';
    const list = Array.isArray(values) ? values : Profile.parseSet(values);
    return [...new Set(list)].join(',');
  }

  // 필수, 추가 기능: DB row(snake_case)를 Profile 모델(camelCase)로 변환
  static fromRow(row) {
    if (!row) return null;
    return new Profile({
      intro: row.intro ?? null,
      collaborationMode: row.collaboration_mode ?? row.collaborationMode ?? 'ANY',
      activeTimes: Profile.parseSet(row.active_times ?? row.activeTimes),
      lookingForTeam:
        row.looking_for_team !== undefined
          ? Boolean(row.looking_for_team)
          : Boolean(row.lookingForTeam ?? true),
      portfolioUrl: row.portfolio_url ?? row.portfolioUrl ?? null,
    });
  }

  // 필수, 추가 기능: JSON 응답용 객체 반환
  toJSON() {
    return {
      intro: this.intro,
      collaborationMode: this.collaborationMode,
      activeTimes: this.activeTimes,
      lookingForTeam: this.lookingForTeam,
      portfolioUrl: this.portfolioUrl,
    };
  }
}

module.exports = Profile;
