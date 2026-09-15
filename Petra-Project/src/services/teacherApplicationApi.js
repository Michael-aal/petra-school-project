import { request } from "./apiClient";

export const teacherApplicationApi = {
  submit: (payload) =>
    request("/api/teacher/applications", {
      method: "POST",
      body: payload,
    }),
};
