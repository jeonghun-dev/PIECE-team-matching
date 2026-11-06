const questionController = require("../controllers/questionController")
const express = require("express");
const projectController = require("../controllers/projectController");
const AuthMiddleware = require("../middlewares/auth");

const router = express.Router();

// 모집 글 등록
router.post("/", AuthMiddleware.requireAuth, projectController.publish);

//모집 글에 질문 등록
router.post(
    "/:projectId/questions",
    AuthMiddleware.requireAuth,
    questionController.createForProject
);
module.exports = router;