import { request } from "./apiClient";

export const admissionApi = {
  submit: (payload) =>
    request("/api/admissions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  list: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, value);
      }
    });
    return request(`/api/admissions${query.toString() ? `?${query.toString()}` : ""}`);
  },
  approve: (id) =>
    request(`/api/admissions/${encodeURIComponent(id)}/approve`, {
      method: "PATCH",
    }),
  reject: (id, reason) =>
    request(`/api/admissions/${encodeURIComponent(id)}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),
  getById: (id) => request(`/api/admissions/${encodeURIComponent(id)}`),
  enroll: (id, data = {}) => request(`/api/admissions/${encodeURIComponent(id)}/enroll`, { method: "POST", body: JSON.stringify(data) }),
};
