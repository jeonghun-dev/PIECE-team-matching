// 모집 글 API 함수 - 서버 주소와 토큰은 client.js에서 처리
import client from "./client";

// 모집 목록 조회 (기존 함수와 같이 Axios 응답 전체를 반환)
export const getProjects = (params = {}) => {
    return client.get("/projects", { params });
};

// 모집 글 상세 조회
export const getProject = (id) => {
    return client.get(`/projects/${id}`);
};

// 현재 로그인한 사용자의 학습 레벨에 맞는 모집 중 프로젝트 추천
export const getRecommendedProjects = () => client.get("/projects/recommended");

// 모집 글 등록
export const createProject = (data) => {
    return client.post("/projects", data);
};

// 모집 글 수정
export const updateProject = (id, data) => {
    return client.put(`/projects/${id}`, data);
};

// 모집 글 삭제
export const deleteProject = (id) => {
    return client.delete(`/projects/${id}`);
};
