/**
 * User 도메인 모델 (DB: users 테이블 기본 회원 정보)
 * 담당: 박도영
 * 구분: 필수, 추가 기능 (회원가입·로그인·인증: 필수 / 회원 상태 및 프로필 연동: 추가 기능)
 */

// 본인 정보 응답 직렬화 (passwordHash 제외)
const toMeJSON = (user) => ({
  id: user.id,
  email: user.email,
  nickname: user.nickname,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// 타 사용자 공개 프로필 응답 직렬화 (NFR-050: email, passwordHash 제외)
const toPublicJSON = (user) => ({
  id: user.id,
  nickname: user.nickname,
  createdAt: user.createdAt,
});

// 회원 객체 팩토리 함수
const createUser = ({
  id = null,
  email,
  nickname,
  passwordHash,
  role = 'USER',
  status = 'ACTIVE',
  createdAt = null,
  updatedAt = null,
}) => {
  const user = {
    id,
    email,
    nickname,
    passwordHash,
    role, // 'USER' | 'ADMIN'
    status, // 'ACTIVE' | 'SUSPENDED'
    createdAt,
    updatedAt,
    // 기존 객체 메서드 호출 호환
    toMeJSON() {
      return toMeJSON(this);
    },
    toPublicJSON() {
      return toPublicJSON(this);
    },
  };
  return user;
};

// DB row(snake_case)를 User 모델(camelCase)로 변환
const fromRow = (row) => {
  if (!row) return null;
  return createUser({
    id: row.id,
    email: row.email,
    nickname: row.nickname,
    passwordHash: row.password_hash ?? row.passwordHash,
    role: row.role || 'USER',
    status: row.status || 'ACTIVE',
    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
  });
};

module.exports = {
  createUser,
  fromRow,
  toMeJSON,
  toPublicJSON,
};