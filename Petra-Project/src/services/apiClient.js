import { API_BASE_URL, clearAuthToken, isTabAuthMode, readAuthToken } from "./authApi";

export const request = async (path, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Dashboard requests must remain bound to the current browser tab. A tab
  // marker is sent even when its short-lived access token is temporarily
  // unavailable, which prevents the backend from selecting another tab's
  // shared HttpOnly cookie.
  const tabToken = readAuthToken();
  if (tabToken && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${tabToken}`;
  }
  if (isTabAuthMode() && !headers["X-Petra-Tab-Auth"] && !headers["x-petra-tab-auth"]) {
    headers["X-Petra-Tab-Auth"] = "1";
  }

  const selectedSchoolId = localStorage.getItem("petra_selected_school_id");
  if (selectedSchoolId) {
    headers["x-school-id"] = selectedSchoolId;
  }

  const body = options.body;
  const serializedBody =
    body !== undefined && body !== null && typeof body === "object" && !(body instanceof FormData)
      ? JSON.stringify(body)
      : body;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
    body: serializedBody,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      // Clear only the access token. Keep tab-auth mode so a failed/expired
      // tab session can never fall through to another tab's cookie.
      try {
        window.sessionStorage.removeItem("petra_tab_access");
      } catch {
        clearAuthToken();
      }
    }

    const message =
      data.message === "School context missing"
        ? "Select a school to continue."
        : data.message || "Request failed";

    const error = new Error(message);
    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
};
