import { API_BASE_URL, readAuthToken } from "./authApi";

const request = async (path, options = {}) => {
  const token = readAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

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

const queryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  const result = query.toString();
  return result ? `?${result}` : "";
};

export const superAdminApi = {
  stats: () => request("/api/superadmin/dashboard/stats"),
  schools: (params = {}) => request(`/api/superadmin/schools${queryString(params)}`),
  school: (id) => request(`/api/superadmin/schools/${encodeURIComponent(id)}`),
  createSchool: (payload) => request("/api/superadmin/schools", { method: "POST", body: JSON.stringify(payload) }),
  updateSchool: (id, payload) => request(`/api/superadmin/schools/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) }),
  updateSchoolStatus: (id, isActive) => request(`/api/superadmin/schools/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ isActive }) }),
  users: (params = {}) => request(`/api/superadmin/users${queryString(params)}`),
  schoolUsers: (id, params = {}) => request(`/api/superadmin/schools/${encodeURIComponent(id)}/users${queryString(params)}`),
  logs: (params = {}) => request(`/api/superadmin/logs${queryString(params)}`),
};

