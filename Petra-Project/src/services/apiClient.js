import { API_BASE_URL, authApi, clearAuthToken, isTabAuthMode, readAuthToken } from "./authApi";

export const request = async (path, options = {}, retryAuth = true) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

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
    if (response.status === 401 && retryAuth && isTabAuthMode() && !path.includes("/api/auth/refresh")) {
      try {
        await authApi.refresh();
        return request(path, options, false);
      } catch {
        // This tab's session is no longer refreshable. Remove its tab
        // credentials before retrying so the normal HttpOnly cookie session
        // can authenticate the request instead of sending a stale tab marker.
        clearAuthToken();
        return request(path, options, false);
      }
    }

    if (response.status === 401) {
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
