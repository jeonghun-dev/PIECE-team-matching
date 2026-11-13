/**
 * Profile 도메인 모델 (DB: users 테이블 기술 프로필 컬럼)
 * 담당: 박도영
 * 구분: 필수, 추가 기능 (회원가입 초기 프로필 입력: 필수 / 마이페이지 프로필 수정·팀원 상세 조회: 추가 기능)
 */

// MySQL SET 문자열('WEEKDAY_DAY,WEEKEND_AM')을 배열로 변환
const parseSet = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

// 배열을 MySQL SET 저장용 문자열로 변환
const toSetString = (values) => {
  if (!values) return '';
  const list = Array.isArray(values) ? values : parseSet(values);
  return [...new Set(list)].join(',');
};

// JSON 직렬화 함수
const toJSON = (profile) => ({
  intro: profile.intro,
  collaborationMode: profile.collaborationMode,
  activeTimes: profile.activeTimes,
  lookingForTeam: profile.lookingForTeam,
  portfolioUrl: profile.portfolioUrl,
});

// 기술 프로필 객체 팩토리 함수
const createProfile = ({
  intro = null,
  collaborationMode = 'ANY',
  activeTimes = [],
  lookingForTeam = true,
  portfolioUrl = null,
} = {}) => {
  const profile = {
    intro: intro ?? null,
    collaborationMode, // 'ONLINE' | 'OFFLINE' | 'ANY'
    activeTimes: Array.isArray(activeTimes) ? activeTimes : parseSet(activeTimes),
    lookingForTeam: Boolean(lookingForTeam),
    portfolioUrl: portfolioUrl || null,
    toJSON() {
      return toJSON(this);
    },
  };
  return profile;
};

// DB row(snake_case)를 Profile 모델(camelCase)로 변환
const fromRow = (row) => {
  if (!row) return null;
  return createProfile({
    intro: row.intro ?? null,
    collaborationMode: row.collaboration_mode ?? row.collaborationMode ?? 'ANY',
    activeTimes: parseSet(row.active_times ?? row.activeTimes),
    lookingForTeam:
      row.looking_for_team !== undefined
        ? Boolean(row.looking_for_team)
        : Boolean(row.lookingForTeam ?? true),
    portfolioUrl: row.portfolio_url ?? row.portfolioUrl ?? null,
  });
};

module.exports = {
  createProfile,
  parseSet,
  toSetString,
  fromRow,
  toJSON,
};