import { API_BASE_URL } from "./authApi";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const walletApi = {
  getWallet: () => request("/api/wallet", { method: "GET" }),
  getTransactions: () => request("/api/wallet/transactions", { method: "GET" }),
  getStatement: (params) => {
    const query = new URLSearchParams(params || {}).toString();
    return request(`/api/wallet/statement?${query}`, { method: "GET" });
  },
  withdraw: (payload) =>
    request("/api/wallet/withdraw", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  transfer: (payload) =>
    request("/api/wallet/transfer", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  initializePaystack: (amount) =>
    request("/api/wallet/paystack/initialize", {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),
};
