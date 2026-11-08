const express = require("express");
const moderationController = require("../controllers/moderationController");
const AuthMiddleware = require("../middlewares/auth");

const router = express.Router();

// 신고 접수
router.post(
  "/reports",
  AuthMiddleware.requireAuth,
  moderationController.report,
);

// 관리자 전용: requireAuth로 로그인 확인 후 requireAdmin으로 권한 확인
const adminOnly = [AuthMiddleware.requireAuth, AuthMiddleware.requireAdmin];

// 관리자: 전체 회원 목록
router.get("/admin/users", adminOnly, moderationController.listUsers);

// 관리자: 회원 활동 정지/해제
router.patch(
  "/admin/users/:id/suspend",
  adminOnly,
  moderationController.suspend,
);
router.patch(
  "/admin/users/:id/unsuspend",
  adminOnly,
  moderationController.unsuspend,
);

// 관리자: 신고 목록 / 신고 처리
router.get("/admin/reports", adminOnly, moderationController.listReports);
router.patch(
  "/admin/reports/:id",
  adminOnly,
  moderationController.resolveReport,
);

module.exports = router;
