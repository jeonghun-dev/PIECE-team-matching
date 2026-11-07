const express = require("express");
const {
  signup,
  login,
  logout,
  getMe,
  getLevel,
  updateProfile,
  getMemberProfile,
} = require("../controllers/accountController");
const { requireAuth } = require("../middlewares/auth");
const {
  validateSignupInput,
  validateLoginInput,
  validateProfileInput,
} = require("../middlewares/userValidator");

const router = express.Router();

// 회원가입
router.post("/auth/signup", validateSignupInput, signup);

// 로그인
router.post("/auth/login", validateLoginInput, login);

// 로그아웃 (JWT 인증 필요)
router.post("/auth/logout", requireAuth, logout);

// 추가 기능 라우트들
router.get("/users/me", requireAuth, getMe);
router.get("/users/me/level", requireAuth, getLevel);
router.put("/users/me", requireAuth, validateProfileInput, updateProfile);
router.get("/members/:id", requireAuth, getMemberProfile);

module.exports = router;