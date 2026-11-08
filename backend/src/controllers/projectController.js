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

// 모집 글 수정
const edit = async (req, resp, next) => {
    try{
        const result = await projectService.edit(req.user, req.params.id, req.body);
        sendSuccess(resp, result, "모집 글이 수정되었습니다.");
    }catch(error){
        next(error);
    }
};

// 모집 글 삭제
const remove = async (req, resp, next) => {
    try{
        const result = await projectService.remove(req.user, req.params.id);
        sendSuccess(resp, result, "모집 글이 삭제되었습니다.");
    }catch(error){
        next(error);
    }
};

// 모집 글 목록을 조회하고 공통 응답으로 반환한다.
const list = async (req, resp, next) => {
    try {
        const result = await projectService.list(req.query);

        sendSuccess(resp, result);
    } catch (error) {
        next(error);
    }
};

// 모집 글 상세를 조회하고 공통 응답으로 반환한다.
const detail = async (req, resp, next) => {
    try {
        const result = await projectService.detail(
            req.user,
            req.params.id
        );

        sendSuccess(resp, result);
    } catch (error) {
        next(error);
    }
};


module.exports = { publish, edit, remove,list,detail };