const express = require("express");
const cors = require("cors");
const { createQuestionRouter } = require("./routes/questionRouter");

// 공통 담당자가 전체 서버에 통합할 최소 구성입니다.
function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
  app.use(express.json());
  app.use("/api/questions", createQuestionRouter());
  app.use((req, res) => {
    res.status(404).json({ success: false, data: null, message: "요청한 API가 없습니다." });
  });
  // 공통 errorHandler가 준비되면 그 모듈로 교체합니다.
  app.use((error, req, res, next) => {
    const status = Number.isInteger(error.status) && error.status >= 400 && error.status <= 599
      ? error.status : 500;
    res.status(status).json({ success: false, data: null,
      message: status >= 500 ? "서버 내부 오류가 발생했습니다." : error.message });
  });
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  createApp().listen(port, () => console.log(`PIECE API: http://localhost:${port}`));
}

module.exports = { createApp };
