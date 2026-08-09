import { request } from "./apiClient";

const del = (path) => request(path, { method: "DELETE" });

export const academicApi = {
  sessions: () => request("/api/academic/sessions"),
  createSession: (payload) => request("/api/academic/sessions", { method: "POST", body: JSON.stringify(payload) }),
  updateSession: (id, payload) => request(`/api/academic/sessions/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteSession: (id) => del(`/api/academic/sessions/${id}`),
  classes: () => request("/api/academic/classes"),
  createClass: (payload) => request("/api/academic/classes", { method: "POST", body: JSON.stringify(payload) }),
  updateClass: (id, payload) => request(`/api/academic/classes/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteClass: (id) => del(`/api/academic/classes/${id}`),
  subjects: () => request("/api/academic/subjects"),
  createSubject: (payload) => request("/api/academic/subjects", { method: "POST", body: JSON.stringify(payload) }),
  updateSubject: (id, payload) => request(`/api/academic/subjects/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteSubject: (id) => del(`/api/academic/subjects/${id}`),
  timetable: () => request("/api/academic/timetable"),
  createTimetable: (payload) => request("/api/academic/timetable", { method: "POST", body: JSON.stringify(payload) }),
  updateTimetable: (id, payload) => request(`/api/academic/timetable/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteTimetable: (id) => del(`/api/academic/timetable/${id}`),
  attendance: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/academic/attendance${query ? `?${query}` : ""}`);
  },
};
