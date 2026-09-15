const configuredApiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:5000");

if (!configuredApiUrl) {
  throw new Error("VITE_API_URL must be configured for production builds.");
}

const normalizedApiUrl = configuredApiUrl.replace(/\/+$/, "");

const resolveApiBaseUrl = () => {
  if (typeof window === "undefined") return normalizedApiUrl;

  const configured = new URL(normalizedApiUrl);
  const browserHost = window.location.hostname;
  const isLocalBrowserHost = ["localhost", "127.0.0.1", "::1"].includes(browserHost);

  if (!isLocalBrowserHost && ["localhost", "127.0.0.1", "::1"].includes(configured.hostname)) {
    const forwardedHost = browserHost.replace(/-(\d+)(\.[^.]+\..+)$/, "-5000$2");
    configured.protocol = window.location.protocol;
    configured.hostname = forwardedHost;
  }

  return configured.toString().replace(/\/+$/, "");
};

export const API_BASE_URL = resolveApiBaseUrl();

// The server still issues HttpOnly cookies for normal clients. When Petra is
// opened in multiple tabs, each tab also receives a short-lived tab credential
// stored in sessionStorage. sessionStorage is isolated per browser tab, so a
// login in one tab cannot replace the authentication state of another tab.
const TAB_ACCESS_KEY = "petra_tab_access";
const TAB_REFRESH_KEY = "petra_tab_refresh";

const getTabStorage = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

export const readAuthToken = () => getTabStorage()?.getItem(TAB_ACCESS_KEY) || null;

export const writeAuthToken = (token) => {
  const storage = getTabStorage();
  if (!storage) return;
  if (token) storage.setItem(TAB_ACCESS_KEY, token);
  else storage.removeItem(TAB_ACCESS_KEY);
};

const readTabRefreshToken = () => getTabStorage()?.getItem(TAB_REFRESH_KEY) || null;

const persistTabCredentials = (response) => {
  if (response?.tabSession?.accessToken) writeAuthToken(response.tabSession.accessToken);
  if (response?.tabSession?.refreshToken) {
    getTabStorage()?.setItem(TAB_REFRESH_KEY, response.tabSession.refreshToken);
  }
  return response;
};

const clearTabCredentials = () => {
  const storage = getTabStorage();
  if (!storage) return;
  storage.removeItem(TAB_ACCESS_KEY);
  storage.removeItem(TAB_REFRESH_KEY);
};

export const clearAuthToken = clearTabCredentials;

async function request(path, options = {}, { tabCredential = true } = {}) {
  const requestUrl = `${API_BASE_URL}${path}`;
  const tabToken = tabCredential ? readAuthToken() : null;
  const mergedHeaders = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (tabToken && !mergedHeaders.Authorization && !mergedHeaders.authorization) {
    mergedHeaders.Authorization = `Bearer ${tabToken}`;
  }

  const response = await fetch(requestUrl, {
    ...options,
    credentials: "include",
    headers: mergedHeaders,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) clearTabCredentials();
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
  }, { tabCredential: false }).then(persistTabCredentials);

export const authApi = {
  register: (payload) => authRequest("/api/auth/register", payload),
  staffPending: (payload) => authRequest("/api/auth/staff/pending", payload),
  staffActivate: (payload) => authRequest("/api/auth/staff/activate", payload),
  staffInvitations: () => request("/api/auth/staff/invitations", { method: "GET" }),
  staffInvitationDetails: (token) => request(`/api/auth/staff/invitations/${encodeURIComponent(token)}`, { method: "GET" }),
  createStaffInvitation: (payload) => authRequest("/api/auth/staff/invitations", payload),
  revokeStaffInvitation: (payload) => authRequest("/api/auth/staff/invitations/revoke", payload),
  regenerateStaffInvitationCode: (payload) => authRequest("/api/auth/staff/invitations/regenerate", payload),
  managedTeachers: () => request("/api/auth/staff/teachers", { method: "GET", cache: "no-store" }),
  deactivateTeacher: (teacherUserId) => request(`/api/auth/staff/teachers/${encodeURIComponent(teacherUserId)}/deactivate`, { method: "PATCH" }),
  reactivateTeacher: (teacherUserId) => request(`/api/auth/staff/teachers/${encodeURIComponent(teacherUserId)}/reactivate`, { method: "PATCH" }),
  parentRegister: (payload) => authRequest("/api/auth/parent/register", payload),
  linkChild: (payload) => authRequest("/api/auth/parent/link-child", payload),
  login: (payload) => authRequest("/api/auth/login", payload),
  me: () => request("/api/auth/me", { method: "GET", cache: "no-store" }),
  logout: () => request("/api/auth/revoke", { method: "POST" }).finally(clearTabCredentials),
  refresh: () => {
    const refreshToken = readTabRefreshToken();
    const headers = refreshToken ? { "X-Petra-Tab-Refresh": refreshToken } : {};
    return request("/api/auth/refresh", { method: "POST", headers }, { tabCredential: !refreshToken }).then(persistTabCredentials);
  },
  updateProfile: (payload) => request("/api/auth/profile", { method: "PUT", body: JSON.stringify(payload) }),
  selectSchool: (payload) => request("/api/auth/select-school", { method: "POST", body: JSON.stringify(payload) }),
  changePassword: (payload) => request("/api/auth/change-password", { method: "POST", body: JSON.stringify(payload) }),
  deleteAccount: (payload) => request("/api/auth/account", { method: "DELETE", body: JSON.stringify(payload) }),
};
