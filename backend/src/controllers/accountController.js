/**
 * AccountController: 회원 인증 및 프로필·학습 레벨 HTTP 요청/응답 컨트롤러
 * 담당: 박도영
 * 구분: 필수, 추가 기능
 * - 필수(MVP): signup, login, logout
 * - 추가 기능: getMe, getLevel, getMemberProfile, updateProfile
 * 규칙:
 * - 모든 성공 응답은 { success: true, data, message: null } 형식을 따른다 
 * - 오류는 error.status 속성을 유지하여 next(error)로 공통 에러 미들웨어에 위임한다
 */
const AccountService = require('../services/accountService');

class AccountController {
  constructor(service = new AccountService()) {
    this.service = service;
    this.signup = this.signup.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.getMe = this.getMe.bind(this);
    this.getLevel = this.getLevel.bind(this);
    this.getMemberProfile = this.getMemberProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
  }

  // POST /api/auth/signup 회원가입
  async signup(req, res, next) {
    try {
      const result = await this.service.signup(req.body);   // 서비스에 처리 위탁
      return res.status(201).json({ // 성공하면 201
        success: true,  // 보내주는 데이터 형식.
        data: result,
        message: null,
      });
    } catch (error) {
      return next(error);
    }
  }

  // POST /api/auth/login 로그인
  async login(req, res, next) {
    try {
      const result = await this.service.login(req.body);
      return res.status(200).json({
        success: true,
        data: result,
        message: null,
      });
    } catch (error) {  
      return next(error);
    }
  }

  // POST /api/auth/logout 로그아웃
  async logout(req, res, next) {
    try {
      const result = await this.service.logout(req.user);
      return res.status(200).json({
        success: true,
        data: result,
        message: null,
      });
    } catch (error) {
      return next(error);
    }
  }

  // 추가 기능(아직 구현X): GET /api/users/me 내 정보 및 기술 프로필·레벨 통합 조회
  async getMe(req, res, next) {
    try {
      const result = await this.service.getMe(req.user);
      return res.status(200).json({
        success: true,
        data: result,
        message: null,
      });
    } catch (error) {
      return next(error);
    }
  }

  // 추가 기능(아직 구현X): GET /api/users/me/level 내 학습 점수(항목별 배점·총점) 및 레벨 조회
  async getLevel(req, res, next) {
    try {
      const result = await this.service.getLevel(req.user);
      return res.status(200).json({
        success: true,
        data: result,
        message: null,
      });
    } catch (error) {
      return next(error);
    }
  }

  // 추가 기능(아직 구현X): GET /api/members/:id 타 회원 공개 프로필 상세 조회
  async getMemberProfile(req, res, next) {
    try {
      const result = await this.service.getMemberProfile(req.params.id);
      return res.status(200).json({
        success: true,
        data: result,
        message: null,
      });
    } catch (error) {
      return next(error);
    }
  }

  // 추가 기능(아직 구현X): PUT /api/users/me 내 기술 프로필 및 학습 이력 수정
  async updateProfile(req, res, next) {
    try {
      const result = await this.service.updateProfile(req.user, req.body);
      return res.status(200).json({
        success: true,
        data: result,
        message: null,
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = AccountController;
