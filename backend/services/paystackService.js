import { createHmac, timingSafeEqual, randomBytes } from "crypto";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = "https://api.paystack.co";
const PAYSTACK_TIMEOUT_MS = Number(process.env.PAYSTACK_TIMEOUT_MS || 10000);

const buildReference = () => `petra_ref_${Date.now()}_${randomBytes(4).toString("hex")}`;

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

const requestPaystack = async (url, options) => {
  let response;
  try {
    response = await fetch(url, { ...options, signal: AbortSignal.timeout(PAYSTACK_TIMEOUT_MS) });
  } catch (error) {
    const timeout = error?.name === "TimeoutError" || error?.name === "AbortError";
    const failure = new Error(timeout ? "Paystack request timed out" : "Paystack request failed");
    failure.statusCode = 502;
    failure.cause = error;
    throw failure;
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    const failure = new Error("Paystack returned an invalid response");
    failure.statusCode = 502;
    failure.cause = error;
    throw failure;
  }

  return { response, data };
};

export const paystackService = {
  initializePayment: async ({ amount, email, userId, reference, metadata = {}, callbackUrl }) => {
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      const error = new Error("Amount must be a positive number");
      error.statusCode = 400;
      throw error;
    }

    const { data } = await requestPaystack(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: "POST",
      headers: getPaystackHeaders(),
      body: JSON.stringify({
        email,
        amount: Math.round(parsedAmount * 100),
        reference: reference || buildReference(),
        metadata: { userId, ...metadata },
        callback_url: callbackUrl || process.env.PAYSTACK_CALLBACK_URL || undefined,
      }),
    });
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
    if (!signatureHeader || typeof signatureHeader !== "string") {
      return false;
    }

    const secret = process.env.PAYSTACK_SECRET_KEY || "";
    const hash = createHmac("sha512", secret).update(rawBody).digest("hex");
    const hashBuf = Buffer.from(hash, "utf8");
    const sigBuf = Buffer.from(signatureHeader, "utf8");

    if (hashBuf.length !== sigBuf.length) {
      return false;
    }

    return timingSafeEqual(hashBuf, sigBuf);
  },

  verifyTransaction: async (reference) => {
    const { data } = await requestPaystack(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: getPaystackHeaders(),
    });
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
