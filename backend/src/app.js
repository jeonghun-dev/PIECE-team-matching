require("dotenv").config();

//1. 모듈 호출
const express = require("express");
const cors = require("cors");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const discoveryRouter = require("./routes/discoveryRouter");
const accountRouter = require("./routes/accountRouter");
const projectRouter = require("./routes/projectRouter");
const recruitmentRouter = require("./routes/recruitmentRouter");
const questionRouter = require("./routes/questionRouter");
const createAnswerRouter = require("./routes/answerRouter");
const moderationRouter = require("./routes/moderationRouter");
const inboxRouter = require("./routes/inboxRouter");
const { requireAuth } = require("./middlewares/auth");

//2.웹 앱 초기화
const app = express();

const HOST = "localhost";
const PORT = process.env.PORT || 3000;

//3. 미들웨어 설정
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

//4. 기본 테스트 URL 라우팅
app.get("/", (req, res) => {
  res.send("Express 서버 실행 중");
});

app.use("/api/members", requireAuth, discoveryRouter);
app.use("/api", accountRouter);
app.use("/api/projects", projectRouter);
app.use("/api", recruitmentRouter);
app.use("/api", inboxRouter);
app.use("/api/questions", questionRouter);
app.use("/api", createAnswerRouter(requireAuth));
app.use("/api", moderationRouter);

app.use(notFound); // 404 Not Found 처리 미들웨어
app.use(errorHandler); // 모든 에러 처리 미들웨어

// 5. 서버 실행
app.listen(PORT, () => {
  console.log(`http://${HOST}:${PORT} 서버가 실행 중입니다.`);
});
