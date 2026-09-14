import { request } from "./apiClient";

const queryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  const result = query.toString();
  return result ? `?${result}` : "";
};

export const supportApi = {
  list: (params = {}) => request(`/api/messages/support${queryString(params)}`),
  create: (payload) => request("/api/messages/support", { method: "POST", body: JSON.stringify(payload) }),
  get: (id) => request(`/api/messages/support/${encodeURIComponent(id)}`),
  reply: (id, payload) => request(`/api/messages/support/${encodeURIComponent(id)}/messages`, { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/api/messages/support/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) }),
};
