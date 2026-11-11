const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Profile = require("../models/profile");
const LearningHistory = require("../models/learningHistory");
const { calculate } = require("../policies/levelPolicy");
const accountRepository = require("../repositories/accountRepository");
const { createError } = require("../utils/createError");
const { parseId } = require("../utils/parseId");
const SALT_ROUNDS = 10;
const TOKEN_EXPIRES_IN = "1h";
// 회원가입 처리
const signup = async (input) => {
  const email = input.email.trim().toLowerCase();
  const nickname = input.nickname.trim();
  const existingEmail = await accountRepository.findByEmail(email);
  if (existingEmail) {
    throw createError(409, "이미 사용 중인 이메일입니다.");
  }
  const existingNickname = await accountRepository.findByNickname(nickname);
  if (existingNickname) {
    throw createError(409, "이미 사용 중인 닉네임입니다.");
  }
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const levelResult = calculate({
    certificates: input.certificates || [],
    awardCount: input.awardCount ?? 0,
    projectCount: input.projectCount ?? 0,
  });
  let userId;
  try {
    userId = await accountRepository.createUser({
      email,
      nickname,
      passwordHash,
      role: "USER",
      status: "ACTIVE",
      intro: input.intro ? input.intro.trim() : null,
      collaborationMode: input.collaborationMode,
      activeTimes: input.activeTimes,
      lookingForTeam:
        input.lookingForTeam !== undefined ? Boolean(input.lookingForTeam) : true,
      portfolioUrl: input.portfolioUrl ? input.portfolioUrl.trim() : null,
      certificates: levelResult.certificates,
      awardCount: levelResult.awardCount,
      projectCount: levelResult.projectCount,
      totalScore: levelResult.totalScore,
      level: levelResult.level,
    });
  } catch (dbErr) {
    if (dbErr && (dbErr.code === "ER_DUP_ENTRY" || dbErr.errno === 1062)) {
      throw createError(409, "이미 사용 중인 이메일 또는 닉네임입니다.");
    }
    throw dbErr;
  }
  const createdRow = await accountRepository.findById(userId);
  const user = User.fromRow(createdRow);
  const profile = Profile.fromRow(createdRow);
  return {
    user: user.toMeJSON(),
    profile: profile.toJSON(),
    learning: levelResult,
  };
};
// 로그인 처리 및 JWT 발급
const login = async (credentials) => {
  const email = credentials.email.trim().toLowerCase();
  const row = await accountRepository.findByEmail(email);
  if (!row) {
    throw createError(401, "이메일 또는 비밀번호가 올바르지 않습니다.");
  }
  const isPasswordMatched = await bcrypt.compare(
    credentials.password,
    row.password_hash
  );
  if (!isPasswordMatched) {
    throw createError(401, "이메일 또는 비밀번호가 올바르지 않습니다.");
  }
  if (row.status === "SUSPENDED") {
    throw createError(403, "운영 정책 위반으로 활동이 정지된 계정입니다.");
  }
  const payload = {
    id: row.id,
    nickname: row.nickname,
    role: row.role,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES_IN,
  });
  const user = User.fromRow(row);
  const learning = LearningHistory.fromRow(row);
  return {
    token,
    user: {
      ...user.toMeJSON(),
      level: learning.level,
      totalScore: learning.totalScore,
    },
  };
};
// 로그아웃 처리
const logout = async (actor) => {
  if (!actor || !actor.id) {
    throw createError(401, "로그인이 필요합니다.");
  }
  return { loggedOut: true };
};
// 인증 미들웨어용 회원 활성 상태 확인
const assertActive = async (userId) => {
  if (!userId) {
    throw createError(401, "유효하지 않은 인증 정보입니다.");
  }
  const row = await accountRepository.findById(userId);
  if (!row) {
    throw createError(401, "존재하지 않는 회원입니다.");
  }
  if (row.status === "SUSPENDED") {
    throw createError(403, "활동이 정지된 계정입니다.");
  }
  return {
    id: row.id,
    email: row.email,
    nickname: row.nickname,
    role: row.role,
    status: row.status,
    level: row.level,
  };
};

  // 추가 기능: 내 정보(기본 계정 + 기술 프로필 + 학습 이력·점수) 통합 조회
  const getMe = async (actor) => {
    const row = await accountRepository.findById(actor.id);
    if (!row) {
      throw createError(404, '회원 정보를 찾을 수 없습니다.');
    }

    const user = User.fromRow(row);
    const profile = Profile.fromRow(row);
    const history = LearningHistory.fromRow(row);
    const breakdown = calculate(history);

    return {
      ...user.toMeJSON(),
      level: breakdown.level,
      totalScore: breakdown.totalScore, 
      profile: profile.toJSON(),
      learning: breakdown,
    };
  }

  // 추가 기능: 내 학습 점수(항목별 배점·총점) 및 3단계 레벨 상세 조회
  const getLevel = async (actor) => {
    const row = await accountRepository.findById(actor.id);
    if (!row) {
      throw createError(404, '회원 정보를 찾을 수 없습니다.');
    }

    const history = LearningHistory.fromRow(row);
    return calculate(history);
  }

  // 추가 기능: 타 사용자 공개 프로필 조회 - 팀원 상세 화면용, 이메일·비밀번호 해시 제외
  const getMemberProfile = async (id) => {
    const memberId = parseId(id, '유효하지 않은 회원 번호입니다.');

    const row = await accountRepository.findById(memberId);
    if (!row || row.status === 'SUSPENDED') {
      throw createError(404, '존재하지 않거나 활동이 제한된 회원입니다.');
    }

    const user = User.fromRow(row);
    const profile = Profile.fromRow(row);
    const history = LearningHistory.fromRow(row);
    const breakdown = calculate(history);

    return {
      ...user.toPublicJSON(),
      profile: profile.toJSON(),
      learning: breakdown,
    };
  }

  // 추가 기능: 내 기술 프로필 및 학습 이력 수정 (이력·총점·레벨을 단일 UPDATE로 함께 갱신
  const updateProfile = async (actor, input) => {
    const currentRow = await accountRepository.findById(actor.id);
    if (!currentRow) {
      throw createError(404, '회원 정보를 찾을 수 없습니다.');
    }

    const currentHistory = LearningHistory.fromRow(currentRow);

    // 입력된 학습 이력(미입력 시 기존 값 유지)을 바탕으로 점수·레벨 재산출
    const levelResult = calculate({
      certificates:
        input.certificates !== undefined
          ? input.certificates
          : currentHistory.certificates,
      awardCount:
        input.awardCount !== undefined
          ? input.awardCount
          : currentHistory.awardCount,
      projectCount:
        input.projectCount !== undefined
          ? input.projectCount
          : currentHistory.projectCount,
    });

    // 프로필과 학습 이력·총점·레벨을 하나의 UPDATE로 저장
    await accountRepository.updateProfile(actor.id, {
      intro: input.intro ? input.intro.trim() : null,
      collaborationMode: input.collaborationMode,
      activeTimes: input.activeTimes,
      lookingForTeam:
        input.lookingForTeam !== undefined
          ? Boolean(input.lookingForTeam)
          : Boolean(currentRow.looking_for_team),
      portfolioUrl: input.portfolioUrl ? input.portfolioUrl.trim() : null,
      certificates: levelResult.certificates,
      awardCount: levelResult.awardCount,
      projectCount: levelResult.projectCount,
      totalScore: levelResult.totalScore,
      level: levelResult.level,
    });

    return getMe(actor);
  }

module.exports = {
  signup,
  login,
  logout,
  assertActive,
  getMe,
  getLevel,
  getMemberProfile,
  updateProfile,
};