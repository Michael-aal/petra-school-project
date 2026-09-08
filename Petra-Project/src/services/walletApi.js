import { request } from "./apiClient";

export const walletApi = {
  getWallet: () => request("/api/wallet", { method: "GET" }),
  getAdminWallet: () => request("/api/finance/wallet/summary", { method: "GET" }),
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
