import { API_BASE_URL, readAuthToken } from "./authApi";

const request = async (path, options = {}) => {
  const token = readAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, credentials: "include", headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

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
  flexpay: () => request("/api/finance/flexpay"),
  cashflow: () => request("/api/finance/cashflow"),
};
