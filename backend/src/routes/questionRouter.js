const express = require("express");
const questionController = require("../controllers/questionController");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

// 목록은 로그인 없이 조회할 수 있다.
router.get(
    "/",
    questionController.list
);

// 질문 등록과 상세 조회는 인증 후 처리한다.
router.post(
    "/",
    requireAuth,
    questionController.create
);

router.get(
    "/:id",
    requireAuth,
    questionController.detail
);

// 로그인한 사용자의 질문 수정 요청을 처리하는 경로이다.
router.put(
    "/:id",
    requireAuth,
    questionController.edit
);


// 질문 삭제는 인증과 Service의 작성자 검사를 거치는 요청이다.
router.delete(
    "/:id",
    requireAuth,
    questionController.remove
);

module.exports = router;
