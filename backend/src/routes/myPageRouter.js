// 마이페이지 라우터 (김성진) - REQ-USR-004
// app.js에서 /api/users/me 경로에 연결
const express = require("express");
const myPageController = require("../controllers/myPageController");
const { requireAuth } = require("../middlewares/auth");
 
const router = express.Router();
 
// 참여 중인 팀
router.get("/teams", requireAuth, myPageController.getMyTeams);
 
// 내가 작성한 모집 글
router.get("/projects", requireAuth, myPageController.getMyProjects);
 
// 최근 작성한 질문
router.get("/questions", requireAuth, myPageController.getMyQuestions);
 
// 최근 작성한 답변
router.get("/answers", requireAuth, myPageController.getMyAnswers);
 
module.exports = router;