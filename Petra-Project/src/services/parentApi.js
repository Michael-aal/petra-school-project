
import { request } from "./apiClient";

export const parentApi = {
  children: () => request("/api/parent/children"),

  child: (studentId) =>
    request(`/api/parent/children/${encodeURIComponent(studentId)}`),

  childHub: (studentId) =>
    request(`/api/parent/children/${encodeURIComponent(studentId)}/hub`),
};

