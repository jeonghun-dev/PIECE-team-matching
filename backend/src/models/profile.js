/**
 * Profile 도메인 모델 (DB의 'users' 테이블 중 기술 프로필 구조를 JS 객체 형태로 표현)
 * 담당: 박도영
 * 구분: 필수, 추가 기능 (회원가입 초기 프로필 입력: 필수 / 마이페이지 프로필 수정·팀원 상세 조회: 추가 기능)
 *
 * [Sequelize → mysql2/promise 전환 포인트]
 * 1. Model에서는 DB(config/db)를 직접 require하지 않습니다. (클래스 다이어그램 규칙: DB 접근은 Repository만 수행)
 * 2. DataTypes.ENUM / SET 상수는 정적 속성(ALLOWED_*)으로 관리하여 Validator나 Service에서도 재사용합니다.
 * 3. Sequelize의 underscored: true 역할은 fromRow(DB snake_case -> JS camelCase)와
 *    toDbParams(JS camelCase -> DB snake_case/SET 문자열/TINYINT) 메서드가 대신 수행합니다.
 */

class Profile {
  // 협업 방식
  static ALLOWED_COLLABORATION_MODES = Object.freeze(['ONLINE', 'OFFLINE', 'ANY']);

  // 활동 시간
  static ALLOWED_ACTIVE_TIMES = Object.freeze([
    'WEEKDAY_DAY',   
    'WEEKDAY_NIGHT', 
    'WEEKEND_AM',
    'WEEKEND_PM',
  ]);

  // 기술 프로필 속성 초기화 (Sequelize define의 컬럼 정의 및 defaultValue 역할)
  constructor({ // 생성자 매개인자
    intro = null,               // VARCHAR(200), allowNull: true
    collaborationMode = 'ANY',  // ENUM('ONLINE','OFFLINE','ANY'), allowNull: false
    activeTimes = [],           // SET(4종), allowNull: false (유효성 검증에서 최소 1개 이상 선택 필수 확인)
    lookingForTeam = true,      // TINYINT(1) / BOOLEAN, defaultValue: true (==1), false(==0)이면 추천 제외
    portfolioUrl = null,        // VARCHAR(500), allowNull: true
  } = {}) 
  { // (생성자)함수 내용
    this.intro = intro !== undefined && intro !== '' ? intro : null;    // 
    this.collaborationMode = collaborationMode;
    this.activeTimes = Array.isArray(activeTimes)
      ? activeTimes
      : Profile.parseSet(activeTimes);
    this.lookingForTeam =
      lookingForTeam !== undefined ? Boolean(lookingForTeam) : true;
    this.portfolioUrl =
      portfolioUrl !== undefined && portfolioUrl !== '' ? portfolioUrl : null;
  }

  // MySQL SET 문자열('WEEKDAY_DAY,WEEKEND_AM') -> JS 배열(['WEEKDAY_DAY', 'WEEKEND_AM']) 변환
  static parseSet(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  // JS 배열(['WEEKDAY_DAY', 'WEEKEND_AM']) -> MySQL SET 저장용 쉼표 문자열 변환
  static toSetString(values) {
    if (!values) return '';
    const list = Array.isArray(values) ? values : Profile.parseSet(values);
    return [...new Set(list)].join(',');
  }

  // DB 조회 결과 row(snake_case) -> Profile 인스턴스(camelCase)로 변환 (Sequelize underscored: true 대체)
  static fromRow(row) {
    if (!row) return null;
    return new Profile({
      intro: row.intro ?? null,
      collaborationMode:
        row.collaboration_mode ?? row.collaborationMode ?? 'ANY',
      activeTimes: Profile.parseSet(row.active_times ?? row.activeTimes),
      lookingForTeam:
        row.looking_for_team !== undefined
          ? Boolean(row.looking_for_team) // MySQL TINYINT(1) 1/0 -> true/false
          : Boolean(row.lookingForTeam ?? true),
      portfolioUrl: row.portfolio_url ?? row.portfolioUrl ?? null,
    });
  }

  // JS 인스턴스 -> Repository SQL 바인딩용 파라미터 변환 (boolean -> 1/0, 배열 -> SET 문자열)
  toDbParams() {
    return {
      intro: this.intro,
      collaboration_mode: this.collaborationMode,
      active_times: Profile.toSetString(this.activeTimes),
      looking_for_team: this.lookingForTeam ? 1 : 0,
      portfolio_url: this.portfolioUrl,
    };
  }

  // 프론트엔드 API 응답용 JSON 직렬화
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