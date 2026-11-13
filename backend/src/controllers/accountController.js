const accountService = require("../services/accountService");
const { sendSuccess } = require("../utils/response");
// POST /api/auth/signup 회원가입
const signup = async (req, res, next) => {
  try {
    const result = await accountService.signup(req.body);
    return sendSuccess(res, result, null, 201);
  } catch (error) {
    return next(error);
  }
};
// POST /api/auth/login 로그인
const login = async (req, res, next) => {
  try {
    const result = await accountService.login(req.body);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};
// POST /api/auth/logout 로그아웃
const logout = async (req, res, next) => {
  try {
    const result = await accountService.logout(req.user);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

  // 추가 기능(아직 구현X): GET /api/users/me 내 정보 및 기술 프로필·레벨 통합 조회
  const getMe = async (req, res, next) => {
    try {
      const result = await accountService.getMe(req.user);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  };

  // 추가 기능(아직 구현X): GET /api/users/me/level 내 학습 점수(항목별 배점·총점) 및 레벨 조회
  const getLevel = async (req, res, next) => {
    try {
      const result = await accountService.getLevel(req.user);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  }

  // 추가 기능(아직 구현X): GET /api/members/:id 타 회원 공개 프로필 상세 조회
  const getMemberProfile = async (req, res, next) => {
    try {
      const result = await accountService.getMemberProfile(req.params.id);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  }

  // 추가 기능(아직 구현X): PUT /api/users/me 내 기술 프로필 및 학습 이력 수정
  const updateProfile = async (req, res, next) => {
    try {
      const result = await accountService.updateProfile(req.user, req.body);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  }

module.exports = {
  signup,
  login,
  logout,
  getMe,
  getLevel,
  getMemberProfile,
  updateProfile,
};