import { API_BASE_URL, readAuthToken } from "./authApi";

const request = async (path, options = {}) => {
  const token = readAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const teacherApi = {
  dashboard: () => request("/api/teacher/dashboard"),
  classes: () => request("/api/teacher/classes"),
  getClass: (id) => request(`/api/teacher/classes/${id}`),
  students: () => request("/api/teacher/students"),
  profile: () => request("/api/teacher/profile"),
  updateProfile: (payload) => request("/api/teacher/profile", { method: "PUT", body: JSON.stringify(payload) }),
  attendance: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/teacher/attendance${query ? `?${query}` : ""}`);
  },
  createAttendance: (payload) => request("/api/teacher/attendance", { method: "POST", body: JSON.stringify(payload) }),
  updateAttendance: (id, payload) => request(`/api/teacher/attendance/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  assessments: () => request("/api/teacher/assessments"),
  createAssessment: (payload) => request("/api/teacher/assessments", { method: "POST", body: JSON.stringify(payload) }),
  updateAssessment: (id, payload) => request(`/api/teacher/assessments/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteAssessment: (id) => request(`/api/teacher/assessments/${id}`, { method: "DELETE" }),
  results: () => request("/api/teacher/results"),
  createResult: (payload) => request("/api/teacher/results", { method: "POST", body: JSON.stringify(payload) }),
  updateResult: (id, payload) => request(`/api/teacher/results/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  announcements: () => request("/api/teacher/announcements"),
  // ClassMarker integration endpoints
  classmarker: {
    createExam: (payload) => request("/api/classmarker/exams", { method: "POST", body: JSON.stringify(payload) }),
    launch: (assessmentId) => request(`/api/classmarker/exams/${assessmentId}/launch`),
    syncResults: (assessmentId) => request(`/api/classmarker/exams/${assessmentId}/sync-results`, { method: "POST" }),
  },
};
