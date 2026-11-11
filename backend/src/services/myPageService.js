// 마이페이지 업무 규칙 (김성진) - REQ-USR-004
// 로그인한 본인 정보만 조회하므로 actor.id로만 조회한다.
const myPageRepository = require("../repositories/myPageRepository");
const { getPagination, toPageResponse } = require("../utils/pagination");
const { createError } = require("../utils/createError");
 
// 'A,B' 문자열을 배열로 (SET 컬럼, GROUP_CONCAT 결과)
const toArray = (value) => {
    if (!value) {
        return [];
    }
    return value.split(",");
};

// 로그인 확인
const checkLogin = (actor) => {
    if (!actor) {
        throw createError(401, "로그인이 필요합니다.");
    }
};

// 참여 중인 팀
const getMyTeams = async (actor, query) => {
    checkLogin(actor);
    const paging = getPagination(query);

    const { items, totalCount } = await myPageRepository.findTeams(actor.id, paging);

    const teams = items.map((item) => ({
        ...item,
        memberCount: Number(item.memberCount),
        activeTimes: toArray(item.activeTimes),
        memberNicknames: toArray(item.memberNicknames),
    }));
    return toPageResponse(teams, totalCount, paging);
};

// 내가 작성한 모집 글
const getMyProjects = async (actor, query) => {
    checkLogin(actor);
    const paging = getPagination(query);

    const { items, totalCount } = await myPageRepository.findProjects(actor.id, paging);

    const projects = items.map((item) => ({
        ...item,
        memberCount: Number(item.memberCount),
        pendingCount: Number(item.pendingCount),
        dDay: Number(item.dDay),
    }));
    return toPageResponse(projects, totalCount, paging);
};

// 최근 작성한 질문
const getMyQuestions = async (actor, query) => {
    checkLogin(actor);
    const paging = getPagination(query);

    const { items, totalCount } = await myPageRepository.findQuestions(actor.id, paging);

    const questions = items.map((item) => ({
        ...item,
        isSolved: Boolean(item.isSolved),
        answerCount: Number(item.answerCount),
    }));
    return toPageResponse(questions, totalCount, paging);
};

// 최근 작성한 답변
const getMyAnswers = async (actor, query) => {
    checkLogin(actor);
    const paging = getPagination(query);

    const { items, totalCount } = await myPageRepository.findAnswers(actor.id, paging);

    const answers = items.map((item) => ({
        ...item,
        isAccepted: Boolean(item.isAccepted),
    }));
    return toPageResponse(answers, totalCount, paging);
};

module.exports = { getMyTeams, getMyProjects, getMyQuestions, getMyAnswers };