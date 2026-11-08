// 모집 글 API 함수 - 서버 주소와 토큰은 client.js에서 처리
import client from "./client";

// 모집 글 등록
export const createProject = (data) => {
    return client.post("/projects", data);
};

// 모집 글 수정
export const updateProject = (id, data) => {
    return client.put(`/projects/${id}`, data);
};