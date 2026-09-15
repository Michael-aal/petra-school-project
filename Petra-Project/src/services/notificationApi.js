import { request } from "./apiClient";

export const notificationApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/notifications${query ? `?${query}` : ""}`);
  },
  markRead: (id) => request(`/api/notifications/${encodeURIComponent(id)}/read`, { method: "POST" }),
  markAllRead: () => request("/api/notifications/read-all", { method: "POST" }),
};

export default notificationApi;
