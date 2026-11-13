const express = require("express");
const recruitmentController = require("../controllers/recruitmentController");
const AuthMiddleware = require("../middlewares/auth");

const router = express.Router();

// 참여 요청 생성
router.post(
  "/projects/:id/applications",
  AuthMiddleware.requireAuth,
  recruitmentController.apply,
);

// 모집 글 작성자의 팀원 초대
router.post(
  "/projects/:id/invitations",
  AuthMiddleware.requireAuth,
  recruitmentController.invite,
);

// 모집 글 작성자 전용 대기 지원자 목록 조회
router.get(
  "/projects/:id/applications",
  AuthMiddleware.requireAuth,
  recruitmentController.listApplicants,
);

// 참여 요청 수락
router.patch(
  "/requests/:id/accept",
  AuthMiddleware.requireAuth,
  recruitmentController.accept,
);

// 참여 요청 거절
router.patch(
  "/requests/:id/reject",
  AuthMiddleware.requireAuth,
  recruitmentController.reject,
);

// 요청 보낸 사람의 취소 (참여 요청/초대 요청)
router.patch(
  "/requests/:id/cancel",
  AuthMiddleware.requireAuth,
  recruitmentController.cancel,
);

// 현재 팀원 목록 조회
router.get(
  "/projects/:id/members",
  AuthMiddleware.requireAuth,
  recruitmentController.listMembers,
);

// 팀원 제외
router.delete(
  "/projects/:id/members/:userId",
  AuthMiddleware.requireAuth,
  recruitmentController.removeMember,
);

module.exports = router;
