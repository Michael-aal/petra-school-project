import { request } from "./apiClient";

export const aiApi = {
  /** Ask Nuvora and persist the message in an authenticated conversation. */
  query: (payload) =>
    request("/api/ai/query", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listChats: () =>
    request("/api/ai/chats", {
      method: "GET",
    }),

  getChat: (id) =>
    request(`/api/ai/chats/${encodeURIComponent(id)}`, {
      method: "GET",
    }),

  deleteChat: (id) =>
    request(`/api/ai/chats/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  deleteAllChats: () =>
    request("/api/ai/chats", {
      method: "DELETE",
    }),
};
