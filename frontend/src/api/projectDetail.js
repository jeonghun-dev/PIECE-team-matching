import client from "./client";

// 기존 projects.js와 동일하게 Axios 응답 전체를 반환한다.
export const getProjectMembers = (projectId) => {
  return client.get(`/projects/${projectId}/members`);
};

export const applyToProject = (projectId) => {
  return client.post(`/projects/${projectId}/applications`);
};

export const getProjectQuestions = (projectId) => {
  return client.get(`/projects/${projectId}/questions`);
};

export const createProjectQuestion = (projectId, input) => {
  return client.post(`/projects/${projectId}/questions`, input);
};

export const getMyProjectReports = (projectId) => {
  return client.get("/reports/mine", {
    params: { targetType: "PROJECT", targetIds: String(projectId) }
  });
};

export const reportProject = (projectId, input) => {
  return client.post("/reports", {
    targetType: "PROJECT",
    targetId: Number(projectId),
    reason: input.reason,
    detail: input.detail
  });
};
