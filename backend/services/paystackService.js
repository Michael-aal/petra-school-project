import { createHmac, timingSafeEqual, randomBytes } from "crypto";
import { createResilientProviderClient } from "../utils/axiosWithRetry.js";
import { prisma } from "../config/db.js";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = "https://api.paystack.co";
const paystackClient = createResilientProviderClient({
  provider: "paystack",
  baseURL: PAYSTACK_BASE,
  timeoutEnv: process.env.PAYSTACK_TIMEOUT_MS,
});

const resolveCallbackUrl = (callbackUrl) => {
  if (!callbackUrl) return process.env.PAYSTACK_CALLBACK_URL || undefined;

  let supplied;
  try {
    supplied = new URL(callbackUrl);
  } catch {
    const error = new Error("Payment callback URL is invalid");
    error.statusCode = 400;
    throw error;
  }

  const allowedOrigins = [process.env.CLIENT_URL, process.env.CORS_ORIGIN]
    .filter(Boolean)
    .map((value) => new URL(value).origin);
  if (!allowedOrigins.includes(supplied.origin)) {
    const error = new Error("Payment callback URL is not allowed");
    error.statusCode = 400;
    throw error;
  }
  return supplied.toString();
};

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

const assertPaystackResponse = (response, fallbackMessage) => {
  const data = response.data;
  if (!data?.status) {
    const error = new Error(data?.message || fallbackMessage);
    error.statusCode = 502;
    throw error;
  }
  return data.data;
};

const getSchoolSubaccountCode = async (schoolId) => {
  if (schoolId === undefined || schoolId === null) return null;
  const rows = await prisma.$queryRaw`
    SELECT "paystackSubaccountCode", "status"
    FROM "SchoolPaymentAccount"
    WHERE "schoolId" = ${Number(schoolId)}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row || row.status !== "active") return null;
  return row.paystackSubaccountCode || null;
};

export const paystackService = {
  initializePayment: async ({ amount, email, userId, reference, metadata = {}, callbackUrl }) => {
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      const error = new Error("Amount must be a positive number");
      error.statusCode = 400;
      throw error;
    }

    const schoolId = metadata?.schoolId;
    const subaccount = await getSchoolSubaccountCode(schoolId);
    const body = {
      email,
      amount: Math.round(parsedAmount * 100),
      reference: reference || buildReference(),
      metadata: { userId, ...metadata },
      callback_url: resolveCallbackUrl(callbackUrl),
      ...(subaccount ? { subaccount, bearer: "subaccount" } : {}),
    };

    const response = await paystackClient.post("/transaction/initialize", body, {
      headers: getPaystackHeaders(),
      retryable: false,
    });

    const data = assertPaystackResponse(response, "Paystack initialization failed");
    return {
      authorization_url: data.authorization_url,
      access_code: data.access_code,
      reference: data.reference,
      amount: parsedAmount,
      subaccount: subaccount || null,
    };
  },

  createCustomer: async ({ email, firstName, lastName, phone, metadata = {} }) => {
    const response = await paystackClient.post("/customer", {
      email,
      first_name: firstName,
      last_name: lastName,
      ...(phone ? { phone } : {}),
      metadata,
    }, { headers: getPaystackHeaders(), retryable: false });
    return assertPaystackResponse(response, "Paystack customer creation failed");
  },

  createSubaccount: async ({ businessName, bankCode, accountNumber, percentageCharge = 0, description, primaryContactEmail, primaryContactName, primaryContactPhone, metadata = {} }) => {
    const normalizedBankCode = String(bankCode || "").trim();
    const normalizedAccountNumber = String(accountNumber || "").trim();
    if (!/^\d{3,10}$/.test(normalizedBankCode) || !/^\d{10}$/.test(normalizedAccountNumber)) {
      const error = new Error("A valid bank code and 10-digit account number are required for the settlement account");
      error.statusCode = 400;
      throw error;
    }

    const resolved = await paystackService.resolveBankAccount(normalizedAccountNumber, normalizedBankCode);
    if (!resolved?.accountName) {
      const error = new Error("Unable to verify the settlement account details with Paystack");
      error.statusCode = 400;
      throw error;
    }

    const response = await paystackClient.post("/subaccount", {
      business_name: businessName,
      settlement_bank: normalizedBankCode,
      account_number: normalizedAccountNumber,
      percentage_charge: percentageCharge,
      ...(description ? { description } : {}),
      ...(primaryContactEmail ? { primary_contact_email: primaryContactEmail } : {}),
      ...(primaryContactName ? { primary_contact_name: primaryContactName } : {}),
      ...(primaryContactPhone ? { primary_contact_phone: primaryContactPhone } : {}),
      metadata: JSON.stringify(metadata),
    }, { headers: getPaystackHeaders(), retryable: false });
    return assertPaystackResponse(response, "Paystack subaccount creation failed");
  },

  resolveBankAccount: async (accountNumber, bankCode) => {
    const response = await paystackClient.get(`/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`, {
      headers: getPaystackHeaders(),
    });
    const data = assertPaystackResponse(response, "Unable to verify the settlement bank account");
    return {
      accountNumber: data.account_number,
      accountName: data.account_name,
      bankId: data.bank_id,
      bankName: data.bank_name || null,
    };
  },

  createTransferRecipient: async ({ name, accountNumber, bankCode, description, metadata = {} }) => {
    const response = await paystackClient.post("/transferrecipient", {
      type: "nuban",
      name,
      account_number: String(accountNumber),
      bank_code: String(bankCode),
      currency: "NGN",
      ...(description ? { description } : {}),
      metadata,
    }, { headers: getPaystackHeaders(), retryable: false });
    return assertPaystackResponse(response, "Unable to create the Paystack transfer recipient");
  },

  initiateTransfer: async ({ amount, recipient, reference, reason, currency = "NGN" }) => {
    const parsedAmount = Number(amount);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      const error = new Error("Transfer amount must be a positive whole number in the smallest currency unit");
      error.statusCode = 400;
      throw error;
    }

    const normalizedReference = String(reference || buildReference()).trim();
    if (!/^[a-z0-9_-]{16,50}$/.test(normalizedReference)) {
      const error = new Error("Transfer reference must be 16 to 50 lowercase characters, numbers, hyphens or underscores");
      error.statusCode = 400;
      throw error;
    }

    const response = await paystackClient.post("/transfer", {
      source: "balance",
      amount: parsedAmount,
      recipient,
      reference: normalizedReference,
      ...(reason ? { reason: String(reason).slice(0, 100) } : {}),
      currency,
    }, { headers: getPaystackHeaders(), retryable: false });
    return assertPaystackResponse(response, "Unable to initiate the Paystack transfer");
  },

  verifyTransfer: async (reference) => {
    const response = await paystackClient.get(`/transfer/verify/${encodeURIComponent(reference)}`, {
      headers: getPaystackHeaders(),
    });
    return assertPaystackResponse(response, "Unable to verify the Paystack transfer");
  },

  createDedicatedVirtualAccount: async ({ customer, preferredBank, subaccount }) => {
    const response = await paystackClient.post("/dedicated_account", {
      customer,
      preferred_bank: preferredBank,
      ...(subaccount ? { subaccount } : {}),
    }, { headers: getPaystackHeaders(), retryable: false });
    return assertPaystackResponse(response, "Paystack dedicated virtual account creation failed");
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
    const response = await paystackClient.get(`/transaction/verify/${encodeURIComponent(reference)}`, { headers: getPaystackHeaders() });

    const data = response.data;
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
