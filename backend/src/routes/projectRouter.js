const express = require("express");
const projectController = require("../controllers/projectController");
const AuthMiddleware = require("../middlewares/auth");

const router = express.Router();

// 모집 글 등록
router.post("/", AuthMiddleware.requireAuth, projectController.publish);

module.exports = router;