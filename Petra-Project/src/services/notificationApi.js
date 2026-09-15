import { request } from "./apiClient";

export const notificationApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/notifications${query ? `?${query}` : ""}`);
  },
  unreadSummary: () => request("/api/notifications/unread-summary"),
  markSectionRead: (section) => request(`/api/notifications/section/${encodeURIComponent(section)}/read`, { method: "POST" }),
  markRead: (id) => request(`/api/notifications/${encodeURIComponent(id)}/read`, { method: "POST" }),
  markAllRead: () => request("/api/notifications/read-all", { method: "POST" }),
};

export default notificationApi;
