import { request } from "./apiClient";

export const enrollmentApi = {
  stats: () => request("/api/enrollment/stats"),
  list: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") query.set(key, value);
    });
    return request(`/api/enrollment${query.toString() ? `?${query.toString()}` : ""}`);
  },
  getById: (id) => request(`/api/enrollment/${id}`),
  create: (payload) =>
    request("/api/enrollment", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/api/enrollment/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/api/enrollment/${id}`, {
      method: "DELETE",
    }),
};
