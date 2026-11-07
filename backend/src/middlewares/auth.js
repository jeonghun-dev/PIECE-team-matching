const jwt = require("jsonwebtoken");
const { assertActive } = require("../services/accountService");

const createAuthError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw createAuthError(401, "로그인이 필요합니다.");
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw createAuthError(401, "인증 토큰이 존재하지 않습니다.");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      const message =
        jwtErr.name === "TokenExpiredError"
          ? "인증 토큰이 만료되었습니다. 다시 로그인해주세요."
          : "유효하지 않은 인증 토큰입니다.";
      throw createAuthError(401, message);
    }

    const activeUser = await assertActive(decoded.id);

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
    return next(error);
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      await new Promise((resolve, reject) => {
        requireAuth(req, res, (err) => (err ? reject(err) : resolve()));
      });
    }

    if (req.user.role !== "ADMIN") {
      throw createAuthError(403, "관리자 권한이 필요합니다.");
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { requireAuth, requireAdmin };