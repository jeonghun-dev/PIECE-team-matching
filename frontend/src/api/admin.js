// 관리자 API 함수 - 서버 주소와 토큰은 client.js에서 처리
import client from "./client";

// 회원 목록 (status, keyword, page, size)
export const getAdminUsers = (params) => {
  return client.get("/admin/users", { params });
};

// 회원 활동 정지/해제
export const suspendUser = (id) => {
  return client.patch(`/admin/users/${id}/suspend`);
};

export const unsuspendUser = (id) => {
  return client.patch(`/admin/users/${id}/unsuspend`);
};

// 모집 글 목록 (status, keyword, page, size) / 삭제
export const getAdminProjects = (params) => {
  return client.get("/admin/projects", { params });
};

export const deleteAdminProject = (id) => {
  return client.delete(`/admin/projects/${id}`);
};

// 질문·답변 목록 (type: ALL·QUESTION·ANSWER, keyword, page, size) / 삭제
export const getAdminQna = (params) => {
  return client.get("/admin/qna", { params });
};

export const deleteAdminQuestion = (id) => {
  return client.delete(`/admin/questions/${id}`);
};

export const deleteAdminAnswer = (id) => {
  return client.delete(`/admin/answers/${id}`);
};

// 신고 목록 - 대상 글 1개당 한 줄 (status: PENDING·DONE, targetType, keyword, page, size)
export const getAdminReports = (params) => {
  return client.get("/admin/reports", { params });
};

// 신고 대상 1개의 신고 내역 (신고자·사유·상세 내용)
export const getAdminReportDetail = (targetType, targetId) => {
  return client.get(`/admin/reports/targets/${targetType}/${targetId}`);
};

// 신고 대상 단위 처리 (status: RESOLVED·REJECTED)
export const resolveAdminReport = (targetType, targetId, status) => {
  return client.patch(`/admin/reports/targets/${targetType}/${targetId}`, {
    status,
  });
};
