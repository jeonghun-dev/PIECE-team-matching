/**
 * User 도메인 모델 (DB: users 테이블 기본 회원 정보)
 * 담당: 박도영
 * 구분: 필수, 추가 기능 (회원가입·로그인·인증: 필수 / 회원 상태 및 프로필 연동: 추가 기능)
 */
class User {
  // 필수, 추가 기능: 회원 기본 속성 초기화
  constructor({
    id = null,
    email,
    nickname,
    passwordHash,
    role = 'USER',
    status = 'ACTIVE',
    createdAt = null,
    updatedAt = null,
  }) {
    this.id = id;
    this.email = email;
    this.nickname = nickname;
    this.passwordHash = passwordHash;
    this.role = role; // 'USER' | 'ADMIN'
    this.status = status; // 'ACTIVE' | 'SUSPENDED'
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // 필수, 추가 기능: DB row(snake_case)를 User 모델(camelCase)로 변환
  static fromRow(row) {
    if (!row) return null;
    return new User({
      id: row.id,
      email: row.email,
      nickname: row.nickname,
      passwordHash: row.password_hash ?? row.passwordHash,
      role: row.role || 'USER',
      status: row.status || 'ACTIVE',
      createdAt: row.created_at ?? row.createdAt ?? null,
      updatedAt: row.updated_at ?? row.updatedAt ?? null,
    });
  }

  // 필수: 본인 정보 응답 직렬화 (passwordHash 제외)
  toMeJSON() {
    return {
      id: this.id,
      email: this.email,
      nickname: this.nickname,
      role: this.role,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // 추가 기능: 타 사용자 공개 프로필 응답 직렬화 (NFR-050: email, passwordHash 제외)
  toPublicJSON() {
    return {
      id: this.id,
      nickname: this.nickname,
      createdAt: this.createdAt,
    };
  }
}

module.exports = User;
