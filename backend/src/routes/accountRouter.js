const express = require("express") // Router 사용 위해서.
const UserValidator = require('../middlewares/userValidator.js');   // 유저 정보 변경 시 검증

class AccountRouter {
  constructor(controller, authMiddleware, userValidator = new UserValidator()) {
    this.controller = controller;
    this.authMiddleware = authMiddleware;
    this.userValidator = userValidator;
  }

  // 필수, 추가 기능: Express router에 Account 관련 엔드포인트 등록 (/api 마운트 기준)
  register(router = express.Router()) {
    // [필수] 회원가입 (입력 형식 검증 -> 컨트롤러 -> 서비스 -> 리포지토리)
    router.post(
      '/auth/signup',
      (req, res, next) => 
        this.userValidator.validateSignupInput(req, res, next),
        this.controller.signup
    );

    // 로그인
    router.post(
      '/auth/login',
      (req, res, next) => 
        this.userValidator.validateLoginInput(req, res, next),
        this.controller.login
    );

    // 로그아웃 (JWT 인증 필요)
    router.post(
      '/auth/logout',
      this.authMiddleware.requireAuth,
      this.controller.logout
    );

    // [아직 추가 X] 내 정보 조회 (기본 정보 + 기술 프로필 + 학습 레벨)
    router.get(
      '/users/me',
      this.authMiddleware.requireAuth,
      this.controller.getMe
    );

    // [아직 추가 X] 내 학습 점수 및 레벨 조회
    router.get(
      '/users/me/level',
      this.authMiddleware.requireAuth,
      this.controller.getLevel
    );

    // [아직 추가 X] 내 기술 프로필 및 학습 이력 수정
    router.put(
      '/users/me',
      this.authMiddleware.requireAuth,
      (req, res, next) => this.userValidator.validateProfileInput(req, res, next),
      this.controller.updateProfile
    );

    // [아직 추가 X] 팀원 공개 프로필 상세 조회 (이메일·비밀번호 해시 제외)
    router.get(
      '/members/:id',
      this.authMiddleware.requireAuth,
      this.controller.getMemberProfile
    );

    return router;
  }
}

module.exports = AccountRouter;
