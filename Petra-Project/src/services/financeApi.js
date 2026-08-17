import { request } from "./apiClient";

export const financeApi = {
  payments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/finance/payments${query ? `?${query}` : ""}`);
  },
  payment: (id) => request(`/api/finance/payments/${id}`),
  createPayment: (payload) => request("/api/finance/payments", { method: "POST", body: JSON.stringify(payload) }),
  updatePayment: (id, payload) => request(`/api/finance/payments/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deletePayment: (id) => request(`/api/finance/payments/${id}`, { method: "DELETE" }),
  invoices: () => request("/api/finance/invoices"),
  fees: () => request("/api/finance/fees"),
  parentFees: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/finance/parent/fees${query ? `?${query}` : ""}`, { method: "GET" });
  },
  getReceipt: (paymentId) => request(`/api/finance/payments/${encodeURIComponent(paymentId)}/receipt`, { method: "GET" }),
  createFee: (payload) => request("/api/finance/fees", { method: "POST", body: JSON.stringify(payload) }),
  updateFee: (id, payload) => request(`/api/finance/fees/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteFee: (id) => request(`/api/finance/fees/${id}`, { method: "DELETE" }),
  assignFee: (payload) => request("/api/finance/fees/assign", { method: "POST", body: JSON.stringify(payload) }),
  flexpay: () => request("/api/finance/flexpay"),
  cashflow: (query = {}) => request(`/api/finance/cashflow${new URLSearchParams(query).toString() ? `?${new URLSearchParams(query).toString()}` : ""}`),
};
