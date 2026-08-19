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

