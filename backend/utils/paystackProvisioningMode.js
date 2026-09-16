export const isPaystackTestMode = (secretKey = process.env.PAYSTACK_SECRET_KEY) =>
  String(secretKey || "").trim().startsWith("sk_test_");

// Paystack's current test-mode docs do not provide a stable subaccount-settlement
// bank-account credential. Test-mode payments and dedicated virtual accounts can
// still be exercised, but real settlement provisioning belongs to live mode.
export const shouldProvisionSettlementSubaccount = (secretKey = process.env.PAYSTACK_SECRET_KEY) =>
  !isPaystackTestMode(secretKey);
