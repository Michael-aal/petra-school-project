import { API_BASE_URL, authApi, clearAuthToken, isTabAuthMode, readAuthToken } from "./authApi";

export const request = async (path, options = {}, retryAuth = true) => {
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
    // A dashboard request can hit a normal 15-minute access-token expiry.
    // Refresh the credentials belonging ONLY to this browser tab, then retry
    // the original request once. Never clear the tab's refresh credential here.
    if (response.status === 401 && retryAuth && isTabAuthMode() && !path.includes("/api/auth/refresh")) {
      try {
        await authApi.refresh();
        return request(path, options, false);
      } catch {
        // The refresh token is invalid/revoked; surface the original 401 below.
      }
    }

    if (response.status === 401) {
      // Clear only the access token. Keep tab-auth mode and the refresh token
      // so another request cannot fall through to a different tab's cookie.
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
