const DEFAULT_PRODUCTION_API_URL = "https://petra-school-project.onrender.com";
const configuredApiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? DEFAULT_PRODUCTION_API_URL : "http://localhost:5000");
const normalizedApiUrl = configuredApiUrl.replace(/\/+$/, "");
const resolveApiBaseUrl = () => {
  if (typeof window === "undefined") return normalizedApiUrl;
  const configured = new URL(normalizedApiUrl);
  const browserHost = window.location.hostname;
  const localHosts = ["localhost", "127.0.0.1", "::1"];
  if (!localHosts.includes(browserHost) && localHosts.includes(configured.hostname)) {
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
    const generated = typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    storage.setItem(TAB_ID_KEY, generated);
    return generated;
  } catch { return "unavailable"; }
};

// sessionStorage exists in every browser tab, but a tab should only opt into
// Petra's tab-scoped authentication transport when it actually has tab
// credentials. Otherwise the normal HttpOnly cookie session must remain usable.
export const isTabAuthMode = () => Boolean(getTabStorage()?.getItem(TAB_ACCESS_KEY) || getTabStorage()?.getItem(TAB_REFRESH_KEY));
export const readAuthToken = () => getTabStorage()?.getItem(TAB_ACCESS_KEY) || null;
export const writeAuthToken = (token) => {
  const storage = getTabStorage();
  if (!storage) return;
  if (token) storage.setItem(TAB_ACCESS_KEY, token); else storage.removeItem(TAB_ACCESS_KEY);
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
  storage.removeItem(TAB_ID_KEY);
};
export const clearAuthToken = clearTabCredentials;

let refreshPromise = null;
const refreshTabAccess = async () => {
  const refreshToken = readTabRefreshToken();
  if (!refreshToken) throw Object.assign(new Error("Refresh token missing"), { status: 401 });
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const accessToken = readAuthToken();
    const headers = {
      "Content-Type": "application/json",
      "X-Petra-Tab-Auth": "1",
      "X-Petra-Tab-Id": ensureTabId(),
      "X-Petra-Tab-Refresh": refreshToken,
    };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, { method: "POST", credentials: "include", headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || "Unable to refresh session");
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return persistTabCredentials(data);
  })().finally(() => { refreshPromise = null; });
  return refreshPromise;
};

async function request(path, options = {}, { tabCredential = true, retryAuth = true } = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = tabCredential ? readAuthToken() : null;
  const refreshToken = tabCredential ? readTabRefreshToken() : null;

  if (tabCredential && !token && !path.includes("/api/auth/refresh") && retryAuth && refreshToken) {
    try {
      await refreshTabAccess();
      return request(path, options, { tabCredential: true, retryAuth: false });
    } catch {
      clearTabCredentials();
    }
  }

  if (token && !headers.Authorization && !headers.authorization) headers.Authorization = `Bearer ${token}`;
  if (tabCredential && isTabAuthMode() && !headers["X-Petra-Tab-Auth"] && !headers["x-petra-tab-auth"]) headers["X-Petra-Tab-Auth"] = "1";
  if (tabCredential && isTabAuthMode() && !headers["X-Petra-Tab-Id"] && !headers["x-petra-tab-id"]) headers["X-Petra-Tab-Id"] = ensureTabId();

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, credentials: "include", headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && tabCredential && isTabAuthMode() && retryAuth && !path.includes("/api/auth/refresh")) {
      try {
        await refreshTabAccess();
        return request(path, options, { tabCredential: true, retryAuth: false });
      } catch {
        clearTabCredentials();
        if (retryAuth) return request(path, options, { tabCredential: false, retryAuth: false });
      }
    }
    if (response.status === 401 && isTabAuthMode()) clearTabCredentials();
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

const publicAuthRequest = async (path, payload) => {
  const response = await request(path, { method: "POST", headers: { "X-Petra-Tab-Auth": "1" }, body: JSON.stringify(payload) }, { tabCredential: false });
  return persistTabCredentials(response);
};
const protectedPost = (path, payload) => request(path, { method: "POST", body: JSON.stringify(payload) });

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
  refresh: () => refreshTabAccess(),
  updateProfile: (payload) => request("/api/auth/profile", { method: "PUT", body: JSON.stringify(payload) }),
  selectSchool: (payload) => request("/api/auth/select-school", { method: "POST", body: JSON.stringify(payload) }),
  changePassword: (payload) => request("/api/auth/change-password", { method: "POST", body: JSON.stringify(payload) }),
  deleteAccount: (payload) => request("/api/auth/account", { method: "DELETE", body: JSON.stringify(payload) }),
};
