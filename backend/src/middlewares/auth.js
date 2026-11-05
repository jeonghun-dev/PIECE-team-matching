/* 
requireAuth(req, res, next)
requireAdmin(req, res, next)
*/
/**
 * AuthMiddleware: JWT 토큰 검증 및 회원 활성 상태·권한 확인 미들웨어
 * 담당: 박도영
 * 구분: 필수, 추가 기능 (JWT 로그인 인증 requireAuth: 필수 / 정지 여부 실시간 검증 및 관리자 권한 requireAdmin: 추가 기능)
 * 규칙:
 * - 미들웨어에서 DB pool을 직접 사용하지 않고 accountService.assertActive(userId)를 호출한다.
 * - 오류 생성 시 상태 코드 속성은 error.status로 통일한다.
 */
const jwt = require('jsonwebtoken');

function createAuthError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

class AuthMiddleware {
  constructor(accountService) {
    this.accountService = accountService;
    this.requireAuth = this.requireAuth.bind(this);
    this.requireAdmin = this.requireAdmin.bind(this);
  }

  // 필수, 추가 기능: Bearer JWT 검증 후 AccountService.assertActive로 정지 여부 확인 (NFR-002, NFR-003, NFR-008)
  async requireAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw createAuthError(401, '로그인이 필요합니다.');
      }

      const token = authHeader.slice(7).trim();
      if (!token) {
        throw createAuthError(401, '인증 토큰이 존재하지 않습니다.');
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtErr) {
        const message =
          jwtErr.name === 'TokenExpiredError'
            ? '인증 토큰이 만료되었습니다. 다시 로그인해주세요.'
            : '유효하지 않은 인증 토큰입니다.';
        throw createAuthError(401, message);
      }

      // 추가 기능: 요청마다 회원의 활동 정지(SUSPENDED) 여부를 AccountService를 통해 확인 (NFR-008)
      const activeUser = await this.accountService.assertActive(decoded.id);

      req.user = {
        id: activeUser.id,
        email: activeUser.email,
        nickname: activeUser.nickname,
        role: activeUser.role,
        status: activeUser.status,
        level: activeUser.level,
      };

      return next();
    } catch (error) {
      if (!error.status) {
        error.status = 401;
      }
      return next(error);
    }
  }

  // 추가 기능: 관리자 전용 경로 권한 확인 미들웨어 (REQ-ADM-001~002, NFR-007)
  async requireAdmin(req, res, next) {
    try {
      if (!req.user) {
        await new Promise((resolve, reject) => {
          this.requireAuth(req, res, (err) => (err ? reject(err) : resolve()));
        });
      }

      if (req.user.role !== 'ADMIN') {
        throw createAuthError(403, '관리자 권한이 필요합니다.');
      }

      return next();
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = AuthMiddleware;
