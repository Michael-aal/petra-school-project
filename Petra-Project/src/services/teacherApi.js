import { request } from "./apiClient";

// Teacher workspace endpoints are mounted by the backend at /api/teachers.
export const teacherApi = {
  dashboard: () => request("/api/teachers/dashboard"),
  classes: () => request("/api/teachers/classes"),
  getClass: (id) => request(`/api/teachers/classes/${id}`),
  students: () => request("/api/teachers/students"),
  profile: () => request("/api/teachers/profile"),
  updateProfile: (payload) => request("/api/teachers/profile", { method: "PUT", body: JSON.stringify(payload) }),
  attendance: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/teachers/attendance${query ? `?${query}` : ""}`);
  },
  createAttendance: (payload) => request("/api/teachers/attendance", { method: "POST", body: JSON.stringify(payload) }),
  updateAttendance: (id, payload) => request(`/api/teachers/attendance/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  assessments: () => request("/api/teachers/assessments"),
  createAssessment: (payload) => request("/api/teachers/assessments", { method: "POST", body: JSON.stringify(payload) }),
  updateAssessment: (id, payload) => request(`/api/teachers/assessments/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteAssessment: (id) => request(`/api/teachers/assessments/${id}`, { method: "DELETE" }),
  results: () => request("/api/teachers/results"),
  createResult: (payload) => request("/api/teachers/results", { method: "POST", body: JSON.stringify(payload) }),
  updateResult: (id, payload) => request(`/api/teachers/results/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  announcements: () => request("/api/teachers/announcements"),
  classmarker: {
    createExam: (payload) => request("/api/classmarker/exams", { method: "POST", body: JSON.stringify(payload) }),
    launch: (assessmentId) => request(`/api/classmarker/exams/${assessmentId}/launch`),
    syncResults: (assessmentId) => request(`/api/classmarker/exams/${assessmentId}/sync-results`, { method: "POST" }),
  },
};
