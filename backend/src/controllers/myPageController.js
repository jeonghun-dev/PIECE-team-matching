// 마이페이지 요청·응답 (김성진) - REQ-USR-004
const myPageService = require("../services/myPageService");
const { sendSuccess } = require("../utils/response");
 
// 1. 참여 중인 팀
const getMyTeams = async (req, res, next) => {
    try {
        const result = await myPageService.getMyTeams(req.user, req.query);
        return sendSuccess(res, result, "참여 중인 팀을 조회했습니다.");
    } catch (error) {
        next(error);
    }
};
 
// 2. 내가 작성한 모집 글
const getMyProjects = async (req, res, next) => {
    try {
        const result = await myPageService.getMyProjects(req.user, req.query);
        return sendSuccess(res, result, "내 모집 글을 조회했습니다.");
    } catch (error) {
        next(error);
    }
};
 
// 3. 최근 작성한 질문
const getMyQuestions = async (req, res, next) => {
    try {
        const result = await myPageService.getMyQuestions(req.user, req.query);
        return sendSuccess(res, result, "내 질문을 조회했습니다.");
    } catch (error) {
        next(error);
    }
};
 
// 4. 최근 작성한 답변
const getMyAnswers = async (req, res, next) => {
    try {
        const result = await myPageService.getMyAnswers(req.user, req.query);
        return sendSuccess(res, result, "내 답변을 조회했습니다.");
    } catch (error) {
        next(error);
    }
};
 
module.exports = { getMyTeams, getMyProjects, getMyQuestions, getMyAnswers };