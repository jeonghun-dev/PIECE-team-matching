// 마이페이지 API 함수 - 서버 주소와 토큰은 client.js에서 처리
import client from "./client";

// 참여 중인 팀
export const getMyTeams = (params) => {
    return client.get("/users/me/teams", { params });
};

// 내가 작성한 모집 글
export const getMyProjects = (params) => {
    return client.get("/users/me/projects", { params });
};

// 최근 작성한 질문
export const getMyQuestions = (params) => {
    return client.get("/users/me/questions", { params });
};

// 최근 작성한 답변
export const getMyAnswers = (params) => {
    return client.get("/users/me/answers", { params });
};