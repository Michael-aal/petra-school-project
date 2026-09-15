import { prisma } from "../config/db.js";
import { financeService } from "../services/financeService.js";
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
    const eventKey = webhookEventService.eventKey({
      providerEventId,
      rawBody,
    });
    const reserved = await webhookEventService.reserve({ provider: "paystack", eventKey });
    if (!reserved) {
      await webhookLogModel.complete({ provider: "paystack", requestId });
      return res.status(409).json({ success: false, message: "Duplicate Paystack webhook" });
    }

    let result;
    try {
      const reference = payload?.data?.reference;

      if (payload?.event === "charge.success") {
        if (!reference) {
          throw Object.assign(new Error("Webhook missing payment reference"), { statusCode: 400 });
        }

        const pendingPayment = await prisma.payment.findUnique({
          where: { reference },
          select: { id: true, reference: true, amount: true, status: true },
        });
        if (!pendingPayment) {
          throw Object.assign(new Error("Payment record not found"), { statusCode: 404 });
        }

        const verified = await paystackService.verifyTransaction(reference);
        assertVerifiedPaymentMatchesRecord(pendingPayment, verified);
        result = await financeService.processVerifiedPayment(reference, verified);
      } else if (payload?.event === "charge.failed") {
        if (!reference) {
          throw Object.assign(new Error("Webhook missing payment reference"), { statusCode: 400 });
        }
        result = await financeService.processFailedPayment(
          reference,
          payload?.data?.gateway_response || payload?.data?.failure_message || "Paystack charge failed",
        );
      } else {
        result = payload;
      }

      await webhookEventService.complete("paystack", eventKey);
      await webhookLogModel.complete({ provider: "paystack", requestId });
      await recordAuditMutation({
        user: null,
        schoolId: result?.schoolId || null,
        entity: "Payment",
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

    // A verified school-fee payment is the final admission gate. Once Paystack
    // confirms the charge, promote the already-admitted applicant into the
    // active student/enrollment records used by the student portal.
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
