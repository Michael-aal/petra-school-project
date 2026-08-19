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
