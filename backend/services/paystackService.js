import { createHmac } from "crypto";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = "https://api.paystack.co";

const buildReference = () => `petra_ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const getPaystackHeaders = () => {
  if (!PAYSTACK_SECRET) {
    const error = new Error("Paystack secret key is not configured");
    error.statusCode = 500;
    throw error;
  }

  return {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    "Content-Type": "application/json",
  };
};

export const paystackService = {
  initializePayment: async ({ amount, email, userId }) => {
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      const error = new Error("Amount must be a positive number");
      error.statusCode = 400;
      throw error;
    }

    const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: "POST",
      headers: getPaystackHeaders(),
      body: JSON.stringify({
        email,
        amount: Math.round(parsedAmount * 100),
        reference: buildReference(),
        metadata: { userId },
        callback_url: process.env.PAYSTACK_CALLBACK_URL || undefined,
      }),
    });

    const data = await response.json();
    if (!data?.status) {
      const error = new Error(data?.message || "Paystack initialization failed");
      error.statusCode = 502;
      throw error;
    }

    return {
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
      amount: parsedAmount,
    };
  },

  verifySignature: (rawBody, signatureHeader) => {
    if (!signatureHeader) {
      return false;
    }

    const hash = createHmac("sha512", PAYSTACK_SECRET || "").update(rawBody).digest("hex");
    return hash === signatureHeader;
  },

  verifyTransaction: async (reference) => {
    const response = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: getPaystackHeaders(),
    });

    const data = await response.json();
    if (!data?.status) {
      const error = new Error(data?.message || "Failed to verify Paystack transaction");
      error.statusCode = 502;
      throw error;
    }

    return data.data;
  },

  parseWebhookPayload: (rawBody, signatureHeader) => {
    const bodyString = rawBody instanceof Buffer ? rawBody.toString("utf8") : String(rawBody);

    if (!paystackService.verifySignature(bodyString, signatureHeader)) {
      const error = new Error("Invalid Paystack webhook signature");
      error.statusCode = 401;
      throw error;
    }

    return JSON.parse(bodyString);
  },
};
