const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const AUTH_TOKEN_KEY = "petra_auth_token";

const readAuthToken = () => window.localStorage.getItem(AUTH_TOKEN_KEY);
const writeAuthToken = (token) => {
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
};
const clearAuthToken = () => {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
};

async function request(path, options = {}) {
  const authHeader = readAuthToken();
  const mergedHeaders = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (authHeader) {
    mergedHeaders.Authorization = `Bearer ${authHeader}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: mergedHeaders,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
    }
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

const authRequest = (path, payload) =>
  request(path, {
    method: "POST",
    body: JSON.stringify(payload),
  });

const persistToken = (response) => {
  writeAuthToken(response?.token);
  return response;
};

export const authApi = {
  register: (payload) => authRequest("/api/auth/register", payload).then(persistToken),
  staffPending: (payload) => authRequest("/api/auth/staff/pending", payload),
  staffActivate: (payload) => authRequest("/api/auth/staff/activate", payload).then(persistToken),
  staffInvitations: () =>
    request("/api/auth/staff/invitations", {
      method: "GET",
    }),
  staffInvitationDetails: (token) =>
    request(`/api/auth/staff/invitations/${encodeURIComponent(token)}`, {
      method: "GET",
    }),
  createStaffInvitation: (payload) => authRequest("/api/auth/staff/invitations", payload),
  revokeStaffInvitation: (payload) => authRequest("/api/auth/staff/invitations/revoke", payload),
  regenerateStaffInvitationCode: (payload) => authRequest("/api/auth/staff/invitations/regenerate", payload),
  parentRegister: (payload) => authRequest("/api/auth/parent/register", payload).then(persistToken),
  linkChild: (payload) => authRequest("/api/auth/parent/link-child", payload),
  login: (payload) => authRequest("/api/auth/login", payload).then(persistToken),
  me: () =>
    request("/api/auth/me", {
      method: "GET",
    }),
  logout: () =>
    request("/api/auth/logout", {
      method: "POST",
    }).finally(() => {
      clearAuthToken();
    }),
  updateProfile: (payload) =>
    request("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  changePassword: (payload) =>
    request("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteAccount: (payload) =>
    request("/api/auth/account", {
      method: "DELETE",
      body: JSON.stringify(payload),
    }),
};

export { API_BASE_URL, AUTH_TOKEN_KEY, clearAuthToken, readAuthToken, writeAuthToken };
