import { API_BASE_URL, clearAuthToken, readAuthToken } from "./authApi";

export const request = async (path, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Send the currently selected school to the backend
  const selectedSchoolId = localStorage.getItem("petra_selected_school_id");

  if (selectedSchoolId) {
    headers["x-school-id"] = selectedSchoolId;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
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
