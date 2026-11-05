/**
 * AccountRepository: users 테이블 데이터 접근 계층 (SQL 전용)
 * 담당: 박도영
 * 구분: 필수, 추가 기능 (이메일/닉네임/ID 조회 및 회원 생성: 필수 / 프로필·학습 이력 및 레벨 UPDATE: 추가 기능)
 * 규칙: 모든 쿼리는 ? 플레이스홀더를 사용하여 SQL 인젝션을 방지한다 (NFR-004).
 */
const Profile = require('../models/profile');
const LearningHistory = require('../models/learningHistory');
const defaultPool = require("../config/db");

class AccountRepository {
   constructor() {
    this.pool = defaultPool;
  }

  // 이메일로 회원 단건 조회 (로그인 및 가입 시 이메일 중복 확인)
  async findByEmail(email) {
    const sql = `
      SELECT
        id, email, nickname, password_hash, role, status,
        intro, collaboration_mode, active_times, looking_for_team, portfolio_url,
        certificates, award_count, project_count, total_score, level,
        created_at, updated_at
      FROM users
      WHERE email = ?
      LIMIT 1
    `;
    const [rows] = await this.pool.execute(sql, [email]);
    return rows[0] || null;
  }

  // 닉네임으로 회원 단건 조회 (가입 시 닉네임 중복 확인)
  async findByNickname(nickname) {
    const sql = `
      SELECT
        id, email, nickname, role, status, created_at, updated_at
      FROM users
      WHERE nickname = ?
      LIMIT 1
    `;
    const [rows] = await this.pool.execute(sql, [nickname]);
    return rows[0] || null;
  }

  // 회원 번호(PK)로 회원 전체 정보 조회 (인증 확인, 내 정보, 공개 프로필 조회)
  async findById(id) {
    const sql = `
      SELECT
        id, email, nickname, password_hash, role, status,
        intro, collaboration_mode, active_times, looking_for_team, portfolio_url,
        certificates, award_count, project_count, total_score, level,
        created_at, updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await this.pool.execute(sql, [id]);
    return rows[0] || null;
  }

  // 신규 회원 생성 (기본 계정 정보 + 초기 프로필 + 초기 학습 이력·점수·레벨 저장)
  async createUser(user) {
    const sql = `
      INSERT INTO users (
        email,
        nickname,
        password_hash,
        role,
        status,
        intro,
        collaboration_mode,
        active_times,
        looking_for_team,
        portfolio_url,
        certificates,
        award_count,
        project_count,
        total_score,
        level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const activeTimesSet = Profile.toSetString(user.activeTimes);
    const certificatesSet = LearningHistory.toSetString(user.certificates);

    const params = [
      user.email,
      user.nickname,
      user.passwordHash,
      user.role || 'USER',
      user.status || 'ACTIVE',
      user.intro ?? null,
      user.collaborationMode || 'ANY',
      activeTimesSet,
      user.lookingForTeam !== undefined ? (user.lookingForTeam ? 1 : 0) : 1,
      user.portfolioUrl ?? null,
      certificatesSet,
      Number(user.awardCount ?? 0),
      Number(user.projectCount ?? 0),
      Number(user.totalScore ?? 0.0),
      user.level || 'STARTER',
    ];

    const [result] = await this.pool.execute(sql, params);
    return result.insertId;
  }

  // 추가 기능: 기술 프로필 수정 (학습 이력·총점·레벨이 함께 전달되면 단일 UPDATE로 원자적 저장 - NFR-046)
  async updateProfile(userId, profile) {
    const activeTimesSet = Profile.toSetString(profile.activeTimes);
    const hasHistoryUpdate =
      profile.totalScore !== undefined && profile.level !== undefined;

    if (hasHistoryUpdate) {
      const certificatesSet = LearningHistory.toSetString(profile.certificates);
      const sql = `
        UPDATE users
        SET
          intro = ?,
          collaboration_mode = ?,
          active_times = ?,
          looking_for_team = ?,
          portfolio_url = ?,
          certificates = ?,
          award_count = ?,
          project_count = ?,
          total_score = ?,
          level = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      const [result] = await this.pool.execute(sql, [
        profile.intro ?? null,
        profile.collaborationMode,
        activeTimesSet,
        profile.lookingForTeam ? 1 : 0,
        profile.portfolioUrl ?? null,
        certificatesSet,
        Number(profile.awardCount ?? 0),
        Number(profile.projectCount ?? 0),
        Number(profile.totalScore),
        profile.level,
        userId,
      ]);
      return result.affectedRows;
    }

    const sql = `
      UPDATE users
      SET
        intro = ?,
        collaboration_mode = ?,
        active_times = ?,
        looking_for_team = ?,
        portfolio_url = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const [result] = await this.pool.execute(sql, [
      profile.intro ?? null,
      profile.collaborationMode,
      activeTimesSet,
      profile.lookingForTeam ? 1 : 0,
      profile.portfolioUrl ?? null,
      userId,
    ]);
    return result.affectedRows;
  }

  // 추가 기능: 학습 이력(자격증, 수상 횟수, 프로젝트 완료 횟수)과 재계산된 총점·레벨을 하나의 UPDATE로 함께 저장 (NFR-046)
  async saveHistory(userId, result) {
    const certificatesSet = LearningHistory.toSetString(result.certificates);
    const sql = `
      UPDATE users
      SET
        certificates = ?,
        award_count = ?,
        project_count = ?,
        total_score = ?,
        level = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const [res] = await this.pool.execute(sql, [
      certificatesSet,
      Number(result.awardCount ?? 0),
      Number(result.projectCount ?? 0),
      Number(result.totalScore ?? 0.0),
      result.level || 'STARTER',
      userId,
    ]);
    return res.affectedRows;
  }
}

module.exports = AccountRepository;
