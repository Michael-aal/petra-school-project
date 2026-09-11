import { request } from "./apiClient";

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  return query.toString();
};

export const messageApi = {
  inbox: (params = {}) => request(`/api/messages${buildQuery(params) ? `?${buildQuery(params)}` : ""}`),
  sent: (params = {}) => request(`/api/messages${buildQuery({ ...params, folder: "sent" }) ? `?${buildQuery({ ...params, folder: "sent" })}` : ""}`),
  conversation: (userId) => request(`/api/messages/conversation/${userId}`),
  send: (payload) => request("/api/messages", { method: "POST", body: JSON.stringify(payload) }),
};
