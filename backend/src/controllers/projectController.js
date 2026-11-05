const projectService = require("../services/projectService");
const { sendSuccess } = require("../utils/response");

// 모집 글 등록
const publish = async (req, resp, next) => {
    try{
        const result = await projectService.publish(req.user, req.body);
        sendSuccess(resp, result, "모집 글이 등록되었습니다.", 201);
    }catch(error){
        next(error);
    }
};

module.exports = { publish };