import client from "./client";

export const REQUESTS_UPDATED_EVENT = "piece:requests-updated";
export const notifyRequestsUpdated = () => {
  window.dispatchEvent(new Event(REQUESTS_UPDATED_EVENT));
};

export const inviteToProject = (projectId, data) =>
  client.post(`/projects/${projectId}/invitations`, data);
export const getRequests = (params = {}) => client.get("/requests", { params });
export const getPendingRequestCount = () => client.get("/requests/count");
export const acceptRequest = (id) => client.patch(`/requests/${id}/accept`);
export const rejectRequest = (id) => client.patch(`/requests/${id}/reject`);
export const cancelRequest = (id) => client.patch(`/requests/${id}/cancel`);
export const getNotifications = () => client.get("/notifications");
export const getUnreadNotificationCount = () => client.get("/notifications/count");
export const markNotificationRead = (id) => client.patch(`/notifications/${id}/read`);
export const getMyOpenProjects = () => client.get("/projects/mine/open");
