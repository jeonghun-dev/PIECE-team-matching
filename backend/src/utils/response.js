// 공통 성공 응답
// 형식: { success: true, data: ..., message: ... }
// 실패 응답은 middleware에서 

const sendSuccess = (res, data = null, message = null, status =200) =>{
    return res.status(status).json({
        success: true,
        data,
        message
    });
};

module.exports = { sendSuccess };