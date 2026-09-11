import { request } from "./apiClient";

export const aiApi = {
  /**
   * Ask Nuvora natural language query
   * @param {Object} payload
   * @param {string} payload.message - The natural language question
   * @param {Array} [payload.conversationHistory] - Previous chat turns
   * @param {string} [payload.selectedStudentId] - Optional student ID for parent/guardian context
   */
  query: (payload) =>
    request("/api/ai/query", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
