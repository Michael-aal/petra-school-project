const configuredApiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:5000");

if (!configuredApiUrl) throw new Error("VITE_API_URL must be configured for production builds.");

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

const TAB_ACCESS_KEY = "petra_tab_access";
const TAB_REFRESH_KEY = "petra_tab_refresh";
const TAB_ID_KEY = "petra_tab_id";

const getTabStorage = () => {
  if (typeof window === "undefined") return null;
  try { return window.sessionStorage; } catch { return null; }
};

const ensureTabId = () => {
  const storage = getTabStorage();
  if (!storage) return "server";
  try {
    const existing = storage.getItem(TAB_ID_KEY);
    if (existing) return existing;
    const generated = typeof crypto?.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    storage.setItem(TAB_ID_KEY, generated);
    return generated;
  } catch {
    return "unavailable";
  }
};

// Browser requests always use tab-scoped authentication. This is deliberate:
// an unauthenticated/new tab must never silently authenticate as another tab's
// shared HttpOnly cookie.
export const isTabAuthMode = () => Boolean(getTabStorage());

export const readAuthToken = () => getTabStorage()?.getItem(TAB_ACCESS_KEY) || null;

export const writeAuthToken = (token) => {
  const storage = getTabStorage();
  if (!storage) return;
  if (token) storage.setItem(TAB_ACCESS_KEY, token);
  else storage.removeItem(TAB_ACCESS_KEY);
};

const readTabRefreshToken = () => getTabStorage()?.getItem(TAB_REFRESH_KEY) || null;

const persistTabCredentials = (response) => {
  const storage = getTabStorage();
  if (!storage) return response;
  if (response?.tabSession?.accessToken) storage.setItem(TAB_ACCESS_KEY, response.tabSession.accessToken);
  if (response?.tabSession?.refreshToken) storage.setItem(TAB_REFRESH_KEY, response.tabSession.refreshToken);
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
  if (tabCredential && !mergedHeaders["X-Petra-Tab-Auth"] && !mergedHeaders["x-petra-tab-auth"]) {
    mergedHeaders["X-Petra-Tab-Auth"] = "1";
  }
  if (!mergedHeaders["X-Petra-Tab-Id"] && !mergedHeaders["x-petra-tab-id"]) {
    mergedHeaders["X-Petra-Tab-Id"] = ensureTabId();
  }

  const response = await fetch(requestUrl, {
    ...options,
    credentials: "include",
    headers: mergedHeaders,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) getTabStorage()?.removeItem(TAB_ACCESS_KEY);
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

const publicAuthRequest = (path, payload) =>
  request(path, {
    method: "POST",
    headers: { "X-Petra-Tab-Auth": "1" },
    body: JSON.stringify(payload),
  }, { tabCredential: false }).then(persistTabCredentials);

const protectedPost = (path, payload) =>
  request(path, { method: "POST", body: JSON.stringify(payload) });

export const authApi = {
  register: (payload) => publicAuthRequest("/api/auth/register", payload),
  staffPending: (payload) => publicAuthRequest("/api/auth/staff/pending", payload),
  staffActivate: (payload) => publicAuthRequest("/api/auth/staff/activate", payload),
  staffInvitations: () => request("/api/auth/staff/invitations", { method: "GET" }),
  staffInvitationDetails: (token) => request(`/api/auth/staff/invitations/${encodeURIComponent(token)}`, { method: "GET" }),
  createStaffInvitation: (payload) => protectedPost("/api/auth/staff/invitations", payload),
  revokeStaffInvitation: (payload) => protectedPost("/api/auth/staff/invitations/revoke", payload),
  regenerateStaffInvitationCode: (payload) => protectedPost("/api/auth/staff/invitations/regenerate", payload),
  managedTeachers: () => request("/api/auth/staff/teachers", { method: "GET", cache: "no-store" }),
  deactivateTeacher: (teacherUserId) => request(`/api/auth/staff/teachers/${encodeURIComponent(teacherUserId)}/deactivate`, { method: "PATCH" }),
  reactivateTeacher: (teacherUserId) => request(`/api/auth/staff/teachers/${encodeURIComponent(teacherUserId)}/reactivate`, { method: "PATCH" }),
  parentRegister: (payload) => publicAuthRequest("/api/auth/parent/register", payload),
  login: (payload) => publicAuthRequest("/api/auth/login", payload),
  me: () => request("/api/auth/me", { method: "GET", cache: "no-store" }),
  logout: () => request("/api/auth/revoke", { method: "POST", headers: { "X-Petra-Tab-Auth": "1" } }).finally(clearTabCredentials),
  refresh: () => {
    const refreshToken = readTabRefreshToken();
    const headers = refreshToken
      ? { "X-Petra-Tab-Refresh": refreshToken, "X-Petra-Tab-Auth": "1" }
      : { "X-Petra-Tab-Auth": "1" };
    return request("/api/auth/refresh", { method: "POST", headers }, { tabCredential: false }).then(persistTabCredentials);
  },
  updateProfile: (payload) => request("/api/auth/profile", { method: "PUT", body: JSON.stringify(payload) }),
  selectSchool: (payload) => request("/api/auth/select-school", { method: "POST", body: JSON.stringify(payload) }),
  changePassword: (payload) => request("/api/auth/change-password", { method: "POST", body: JSON.stringify(payload) }),
  deleteAccount: (payload) => request("/api/auth/account", { method: "DELETE", body: JSON.stringify(payload) }),
};
