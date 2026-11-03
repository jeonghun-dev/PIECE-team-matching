require("dotenv").config();

//1. 모듈 호출
const express = require("express");
const cors = require("cors");

//2.웹 앱 초기화
const app = express();

const HOST = "localhost";
const PORT = process.env.PORT || 3000;

//3. 미들웨어 설정
app.use(cors({origin: "http://localhost:5173"}));
app.use(express.json());

//4. 기본 테스트 URL 라우팅
app.get("/", (req, res) => {
    res.send("Express 서버 실행 중");
});


// 5. 서버 실행
app.listen(PORT, () => {
    console.log(`http://${HOST}:${PORT} 서버가 실행 중입니다.`);
});
