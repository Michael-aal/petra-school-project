import { API_BASE_URL, clearAuthToken, readAuthToken } from "./authApi";

export const request = async (path, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Every dashboard/API request must use the authentication session belonging
  // to this browser tab. The tab access token lives in sessionStorage, so it
  // cannot be replaced by another tab's login. The HttpOnly cookie remains as
  // a fallback for clients that do not have a tab credential.
  const tabToken = readAuthToken();
  if (tabToken && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${tabToken}`;
  }

  // Send the currently selected school to the backend.
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
      clearAuthToken();
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
