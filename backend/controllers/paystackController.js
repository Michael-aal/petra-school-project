import { prisma } from "../config/db.js";
import { financeService } from "../services/financeService.js";
import { walletService } from "../services/walletService.js";
import { activateAdmittedStudentAfterFeePayment } from "../services/studentActivationService.js";
import { paystackService } from "../services/paystackService.js";
import { webhookEventService } from "../services/webhookEventService.js";
import { webhookLogModel } from "../models/webhookLogModel.js";
import { recordAuditMutation } from "../middleware/audit.js";

const assertVerifiedPaymentMatchesRecord = (payment, verified) => {
  const verifiedReference = String(verified?.reference || "").trim();
  if (!verifiedReference || verifiedReference !== payment.reference) {
    const error = new Error("Paystack reference does not match the pending payment");
    error.statusCode = 409;
    throw error;
  }

  const providerStatus = String(verified?.status || "").trim().toLowerCase();
  if (providerStatus !== "success") {
    const error = new Error("Paystack transaction was not successful");
    error.statusCode = 409;
    throw error;
  }

  const currency = String(verified?.currency || "").trim().toUpperCase();
  if (currency !== "NGN") {
    const error = new Error("Paystack transaction currency does not match the school payment currency");
    error.statusCode = 409;
    throw error;
  }

  const providerAmountKobo = Number(verified?.amount);
  if (!Number.isSafeInteger(providerAmountKobo) || providerAmountKobo <= 0) {
    const error = new Error("Paystack transaction amount is invalid");
    error.statusCode = 409;
    throw error;
  }

  const expectedAmountKobo = Math.round(Number(payment.amount) * 100);
  if (!Number.isSafeInteger(expectedAmountKobo) || providerAmountKobo !== expectedAmountKobo) {
    const error = new Error("Paystack transaction amount does not match the pending payment");
    error.statusCode = 409;
    throw error;
  }
};

export const handlePaystackWebhook = async (req, res, next) => {
  try {
    const rawBody = req.rawBody || req.body;
    const payload = paystackService.parseWebhookPayload(rawBody, req.headers["x-paystack-signature"]);
    const requestId = String(req.get("Paystack-Request-Id") || "").trim();
    if (!requestId) {
      return res.status(400).json({ success: false, message: "Paystack-Request-Id header is required" });
    }

    const webhookLog = await webhookLogModel.reserve({ provider: "paystack", requestId, rawBody });
    if (!webhookLog) return res.status(409).json({ success: false, message: "Duplicate Paystack webhook" });

    const providerEventId = payload?.data?.id || payload?.data?.reference
      ? `${payload?.event || "unknown"}:${payload.data.id || payload.data.reference}`
      : null;
    const eventKey = webhookEventService.eventKey({ providerEventId, rawBody });
    const reserved = await webhookEventService.reserve({ provider: "paystack", eventKey });
    if (!reserved) {
      await webhookLogModel.complete({ provider: "paystack", requestId });
      return res.status(409).json({ success: false, message: "Duplicate Paystack webhook" });
    }

    let result;
    try {
      const reference = payload?.data?.reference;

      if (payload?.event === "charge.success") {
        if (!reference) throw Object.assign(new Error("Webhook missing payment reference"), { statusCode: 400 });

        // Wallet deposits are provider payments too, but they intentionally do
        // not have a School Payment row. Route them to the wallet ledger first.
        if (payload?.data?.metadata?.purpose === "wallet_deposit" || payload?.data?.metadata?.walletUserId) {
          const verified = await paystackService.verifyTransaction(reference);
          if (String(verified?.reference || "") !== reference || String(verified?.status || "").toLowerCase() !== "success") {
            throw Object.assign(new Error("Paystack wallet deposit could not be verified"), { statusCode: 409 });
          }
          if (String(verified?.currency || "NGN").toUpperCase() !== "NGN") {
            throw Object.assign(new Error("Paystack wallet deposit currency is not NGN"), { statusCode: 409 });
          }
          result = await walletService.processVerifiedPaystackCharge(verified);
        } else {
          const pendingPayment = await prisma.payment.findUnique({
            where: { reference },
            select: { id: true, reference: true, amount: true, status: true },
          });
          if (!pendingPayment) throw Object.assign(new Error("Payment record not found"), { statusCode: 404 });

          const verified = await paystackService.verifyTransaction(reference);
          assertVerifiedPaymentMatchesRecord(pendingPayment, verified);
          result = await financeService.processVerifiedPayment(reference, verified);
        }
      } else if (payload?.event === "charge.failed") {
        if (!reference) throw Object.assign(new Error("Webhook missing payment reference"), { statusCode: 400 });
        result = await financeService.processFailedPayment(
          reference,
          payload?.data?.gateway_response || payload?.data?.failure_message || "Paystack charge failed",
        );
      } else if (["transfer.success", "transfer.failed", "transfer.reversed"].includes(payload?.event)) {
        result = await walletService.processTransferWebhook(payload.data);
      } else {
        result = payload;
      }

      await webhookEventService.complete("paystack", eventKey);
      await webhookLogModel.complete({ provider: "paystack", requestId });
      await recordAuditMutation({
        user: null,
        schoolId: result?.schoolId || null,
        entity: payload?.event?.startsWith("transfer.") ? "WalletTransaction" : "Payment",
        entityId: result?.id || payload?.data?.reference || requestId,
        action: `WEBHOOK_${String(payload?.event || "UNKNOWN").toUpperCase()}`,
        actionType: "PAYMENT",
        after: result,
      });
    } catch (error) {
      await webhookEventService.release("paystack", eventKey);
      await webhookLogModel.release({ provider: "paystack", requestId });
      throw error;
    }

    if (result?.status === "Successful" && result?.studentId && result?.schoolId) {
      const activation = await activateAdmittedStudentAfterFeePayment({
        schoolId: result.schoolId,
        studentId: result.studentId,
        paymentReference: result.reference,
      });
      return res.status(200).json({ success: true, result, activation });
    }

    return res.status(200).json({ success: true, result });
  } catch (error) {
    next(error);
  }
};
