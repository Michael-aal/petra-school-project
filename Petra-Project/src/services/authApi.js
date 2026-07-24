const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const authApi = {
  register: (payload) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  staffPending: (payload) =>
    request("/api/auth/staff/pending", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  staffActivate: (payload) =>
    request("/api/auth/staff/activate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  parentRegister: (payload) =>
    request("/api/auth/parent/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  linkChild: (payload) =>
    request("/api/auth/parent/link-child", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () =>
    request("/api/auth/me", {
      method: "GET",
    }),
  logout: () =>
    request("/api/auth/logout", {
      method: "POST",
    }),
  deleteAccount: (payload) =>
    request("/api/auth/account", {
      method: "DELETE",
      body: JSON.stringify(payload),
    }),
};

export { API_BASE_URL };
