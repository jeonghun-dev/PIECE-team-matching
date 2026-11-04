const express = require("express") // Router 사용 위해서.

const  accountController = require("../controllers/accountController");
const {  } = require("../middlewares/userVaildator");

const router = express.Router(); // Router 생성

// 이미 여기로 오기 전, app.use("/api/auth", 라우터명) 이렇게 부를 것임
// router.post("/signup", UserValidator, accountController.register);