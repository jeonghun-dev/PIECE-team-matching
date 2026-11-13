// 담당 박도영
const pool = require("../config/db");
const Profile = require("../models/profile");
const LearningHistory = require("../models/learningHistory");
const findByEmail = async (email) => {
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
  const [rows] = await pool.execute(sql, [email]);
  return rows[0] || null;
};
const findByNickname = async (nickname) => {
  const sql = `
    SELECT
      id, email, nickname, role, status, created_at, updated_at
    FROM users
    WHERE nickname = ?
    LIMIT 1
  `;
  const [rows] = await pool.execute(sql, [nickname]);
  return rows[0] || null;
};
const findById = async (id) => {
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
  const [rows] = await pool.execute(sql, [id]);
  return rows[0] || null;
};

// 신규 회원 생성 (기본 계정 정보 + 초기 프로필 + 초기 학습 이력·점수·레벨 저장)
const createUser = async (user) => {
  // 기존 로직 동일, this.pool.execute -> pool.execute
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

  const [result] = await pool.execute(sql, params);
  return result.insertId;
};

// 추가 기능: 기술 프로필 수정 (학습 이력·총점·레벨이 함께 전달되면 단일 UPDATE로 원자적 저장 - NFR-046)
const updateProfile = async (userId, profile) => {
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
    const [result] = await pool.execute(sql, [
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
  const [result] = await pool.execute(sql, [
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
const saveHistory = async (userId, result) => {
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
  const [res] = await pool.execute(sql, [
    certificatesSet,
    Number(result.awardCount ?? 0),
    Number(result.projectCount ?? 0),
    Number(result.totalScore ?? 0.0),
    result.level || 'STARTER',
    userId,
  ]);
  return res.affectedRows;
}

module.exports = {
  findByEmail,
  findByNickname,
  findById,
  createUser,
  updateProfile,
  saveHistory,
};