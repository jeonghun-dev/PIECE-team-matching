const express = require("express");
const questionController = require("../controllers/questionController");

const router = express.Router();

// 일반 질문 목록은 로그인 없이 조회할 수 있는 공개 API이다.
router.get("/", questionController.list);

module.exports = router;
