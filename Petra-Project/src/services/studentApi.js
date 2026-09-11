import { request } from "./apiClient";

export const studentApi = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") query.set(key, value);
    });
    return request(`/api/students${query.toString() ? `?${query.toString()}` : ""}`);
  },
  getById: (id) => request(`/api/students/${id}`),
  create: (payload) =>
    request("/api/students", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/api/students/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/api/students/${id}`, {
      method: "DELETE",
    }),
  regenerateAccessCode: (id) =>
    request(`/api/students/${id}/access-code`, {
      method: "POST",
    }),
};

