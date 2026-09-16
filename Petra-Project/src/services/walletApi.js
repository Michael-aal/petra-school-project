import { request } from "./apiClient";

const createIdempotencyKey = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `withdraw_${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
};

export const walletApi = {
  getWallet: () => request("/api/wallet", { method: "GET" }),
  getAdminWallet: () => request("/api/finance/wallet/summary", { method: "GET" }),
  getTransactions: () => request("/api/wallet/transactions", { method: "GET" }),
  getStatement: (params) => {
    const query = new URLSearchParams(params || {}).toString();
    return request(`/api/wallet/statement?${query}`, { method: "GET" });
  },
  getSchoolPaymentAccount: () =>
    request("/api/wallet/school-payment-account", { method: "GET" }),
  setupSchoolPaymentAccount: (payload) =>
    request("/api/wallet/school-payment-account", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  setWithdrawalPin: (pin) =>
    request("/api/wallet/withdrawal-pin", {
      method: "POST",
      body: JSON.stringify({ pin }),
    }),
  withdraw: (payload, idempotencyKey = createIdempotencyKey()) =>
    request("/api/wallet/withdraw", {
      method: "POST",
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
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
