export const isPaystackTestMode = (secretKey = process.env.PAYSTACK_SECRET_KEY) =>
  String(secretKey || "").trim().startsWith("sk_test_");

export const shouldProvisionSettlementSubaccount = (secretKey = process.env.PAYSTACK_SECRET_KEY) =>
  !isPaystackTestMode(secretKey);

export const isDvaFeatureAccessDenied = (error = {}) => {
  const status = Number(error?.providerStatus || error?.response?.status || error?.statusCode || 0);
  const message = String(error?.providerMessage || error?.response?.data?.message || error?.message || "");
  return status === 403 && /dedicated\s+(?:nub?an|virtual)|not available for your business|access denied|activated for this feature/i.test(message);
};

// Test mode can exercise the DVA API when Paystack has enabled it for the
// integration. When the sandbox business is not enabled, Petra must preserve
// the customer and school settlement configuration without pretending a DVA
// exists. Live mode remains strict and requires Paystack activation.
export const shouldGracefullyPendDvaProvisioning = (error, secretKey = process.env.PAYSTACK_SECRET_KEY) =>
  isPaystackTestMode(secretKey) && isDvaFeatureAccessDenied(error);
