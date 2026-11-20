import { request } from "./apiClient";

export const teacherApplicationApi = {
  getLinks: () => request("/api/teacher-applications/links", { method: "GET" }),
  getPublicSchool: (token) => request(`/api/teacher-applications/public/${encodeURIComponent(token)}`, { method: "GET" }),
  submit: (payload) =>
    request("/api/teacher-applications", {
      method: "POST",
      body: payload,
    }),

  list: (params = {}) => {
    const search = new URLSearchParams();
    if (params.status) search.set("status", params.status);
    if (params.q) search.set("q", params.q);
    if (params.limit) search.set("limit", String(params.limit));
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request(`/api/teacher-applications${suffix}`, { method: "GET" });
  },

  get: (id) => request(`/api/teacher-applications/${id}`, { method: "GET" }),

  updateStatus: (id, status) =>
    request(`/api/teacher-applications/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),
};
