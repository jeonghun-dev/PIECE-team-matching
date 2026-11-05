// 어떤 라우터에도 걸리지 않은 요청(404 Not Found)처리
const notFound = (req, res, next) => {
    const error = new Error("요청한 경로를 찾을 수 없습니다.");
    error.status = 404;
    next(error);
};

// 모든 에러 모이는 곳
function errorHandler(error, req, res, next) {
    let status = 500;
    let message = "서버 오류가 발생했습니다.";

    if (error.type === "entity.parse.failed") {
        // 요청 본문이 올바른 JSON이 아닐 때 (express.json()이 던짐)
        status = 400;
        message = "요청 형식이 올바르지 않습니다.";
    } else if (error.status) {
        // status가 붙은 에러: 우리가 의도한 에러 (400, 401, 403, 404, 409)
        status = error.status;
        message = error.message;
    } else {
        // 예상 못 한 에러: 사용자에겐 일반 메시지, 상세 내용은 서버 콘솔에만
        console.error(error);
    }

    res.status(status).json({
        success: false,
        data: null,
        message,
    });
}

module.exports = { notFound, errorHandler }