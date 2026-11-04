const express = require("express");
const controller = require("../controllers/questionController");

// 목록은 비로그인 공개 API입니다. 상세·작성은 이번 범위에 없습니다.
function register(router, questionController = controller) {
  router.get("/", questionController.list);
  return router;
}

module.exports = { register, createQuestionRouter: () => register(express.Router()) };
