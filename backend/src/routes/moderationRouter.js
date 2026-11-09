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

// 관리자: 모집 글 목록 / 삭제
router.get("/admin/projects", adminOnly, moderationController.listProjects);
router.delete(
  "/admin/projects/:id",
  adminOnly,
  moderationController.removeProject,
);

// 관리자: 질문 답변 목록 / 질문 삭제 / 답변 삭제
router.get("/admin/qna", adminOnly, moderationController.listQna);
router.delete(
  "/admin/questions/:id",
  adminOnly,
  moderationController.removeQuestion,
);
router.delete(
  "/admin/answers/:id",
  adminOnly,
  moderationController.removeAnswer,
);

module.exports = router;
