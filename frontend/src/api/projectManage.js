// 지원자 팀원/관리 API (모집자 전용)
import client from "./client";

// 대기 중인 참여 요청 목록
export const getProjectApplicants = (projectId) => {
  return client.get(`/projects/${projectId}/applications`);
};

// 팀원 제외
export const removeProjectMember = (projectId, userId) => {
  return client.delete(`/projects/${projectId}/members/${userId}`);
};
