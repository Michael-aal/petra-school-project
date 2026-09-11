import { request } from "./apiClient";

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      query.set(key, value);
  });
  return query.toString();
};

export const adminApi = {
  results: (params = {}) =>
    request(
      `/api/admin/results${buildQuery(params) ? `?${buildQuery(params)}` : ""}`,
    ),
  dashboard: () => request("/api/admin/dashboard"),
  users: (params = {}) =>
    request(
      `/api/admin/users${buildQuery(params) ? `?${buildQuery(params)}` : ""}`,
    ),
  teachers: (params = {}) =>
    request(
      `/api/admin/teachers${buildQuery(params) ? `?${buildQuery(params)}` : ""}`,
    ),
  admins: () => request("/api/admin/admins"),
  announcements: (params = {}) =>
    request(
      `/api/announcements${buildQuery(params) ? `?${buildQuery(params)}` : ""}`,
    ),
  createAnnouncement: (payload) =>
    request("/api/announcements", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  staffAttendance: (params = {}) =>
    request(
      `/api/admin/staff-attendance${buildQuery(params) ? `?${buildQuery(params)}` : ""}`,
    ),
  roles: () => request("/api/admin/roles"),
  auditLogs: (params = {}) =>
    request(
      `/api/admin/audit-logs${buildQuery(params) ? `?${buildQuery(params)}` : ""}`,
    ),
  teacherAssignments: () => request("/api/admin/teacher-assignments"),
  assignTeacherClass: (payload) =>
    request("/api/admin/teacher-assignments/classes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  removeTeacherClass: (id) =>
    request(`/api/admin/teacher-assignments/classes/${id}`, {
      method: "DELETE",
    }),
  assignTeacherSubject: (payload) =>
    request("/api/admin/teacher-assignments/subjects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  assignClassSubject: (payload) =>
    request("/api/admin/class-subjects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  removeClassSubject: (id) =>
    request(`/api/admin/class-subjects/${id}`, { method: "DELETE" }),
  reportCards: (params = {}) =>
    request(
      `/api/admin/report-cards${buildQuery(params) ? `?${buildQuery(params)}` : ""}`,
    ),
  publishReportCard: (id, fileUrl) =>
    request(`/api/admin/report-cards/${id}/publish`, {
      method: "PATCH",
      body: JSON.stringify({ fileUrl }),
    }),
};
