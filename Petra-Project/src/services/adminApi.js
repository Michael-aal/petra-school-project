import { API_BASE_URL, readAuthToken } from "./authApi";

const request = async (path, options = {}) => {
  const token = readAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  return query.toString();
};

export const adminApi = {
  dashboard: () => request("/api/admin/dashboard"),
  users: (params = {}) => request(`/api/admin/users${buildQuery(params) ? `?${buildQuery(params)}` : ""}`),
  teachers: (params = {}) => request(`/api/admin/teachers${buildQuery(params) ? `?${buildQuery(params)}` : ""}`),
  admins: () => request("/api/admin/admins"),
  staffAttendance: (params = {}) => request(`/api/admin/staff-attendance${buildQuery(params) ? `?${buildQuery(params)}` : ""}`),
  roles: () => request("/api/admin/roles"),
  auditLogs: (params = {}) => request(`/api/admin/audit-logs${buildQuery(params) ? `?${buildQuery(params)}` : ""}`),
};
