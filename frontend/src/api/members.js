import client from "./client";

export const getMembers = (params = {}) => client.get("/members", { params });
export const getMember = (id) => client.get(`/members/${id}`);
