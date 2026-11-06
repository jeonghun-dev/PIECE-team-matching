const express = require("express");
const answerController = require("../controllers/answerController");

function createAnswerRouter(requireAuth) {
  const router = express.Router();

  // 전달받은 JWT 인증 미들웨어를 모든 답변 경로에 적용
  // 존재하지 않는 API 경로는 404 미들웨어에서 처리

  router.get("/questions/:id/answers", requireAuth, answerController.list);

  router.post("/questions/:id/answers", requireAuth, answerController.create);

  router.put("/answers/:id", requireAuth, answerController.edit);

  router.delete("/answers/:id", requireAuth, answerController.remove);

  router.patch("/answers/:id/accept", requireAuth, answerController.accept);

  return router;
}

module.exports = createAnswerRouter;
