// 1.
const express = require("express");
const answerController = require("../controllers/answerController");

function createAnswerRouter(requireAuth) {
  const router = express.Router();

  // 전달받은 JWT 인증 미들웨어를 모든 답변 경로에 적용
  router.use(requireAuth);

  router.get("/questions/:id/answers", answerController.list);

  router.post("/questions/:id/answers", answerController.create);

  router.put("/answers/:id", answerController.edit);

  router.delete("/answers/:id", answerController.remove);

  router.patch("/answers/:id/accept", answerController.accept);

  return router;
}

module.exports = createAnswerRouter;
