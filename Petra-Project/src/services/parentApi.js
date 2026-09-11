import { request } from "./apiClient";

export const parentApi = {
  children: () => request("/api/parent/children"),
  child: (studentId) => request(`/api/parent/children/${studentId}`),
  childHub: (studentId) => request(`/api/parent/children/${studentId}/hub`),
};
