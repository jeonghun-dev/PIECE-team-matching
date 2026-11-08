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

module.exports = router;
