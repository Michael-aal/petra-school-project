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

export const messageApi = {
  inbox: (params = {}) => request(`/api/messages${buildQuery(params) ? `?${buildQuery(params)}` : ""}`),
  sent: (params = {}) => request(`/api/messages${buildQuery({ ...params, folder: "sent" }) ? `?${buildQuery({ ...params, folder: "sent" })}` : ""}`),
  conversation: (userId) => request(`/api/messages/conversation/${userId}`),
  send: (payload) => request("/api/messages", { method: "POST", body: JSON.stringify(payload) }),
};
