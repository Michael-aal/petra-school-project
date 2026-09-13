import { financeService } from "../services/financeService.js";
import { activateAdmittedStudentAfterFeePayment } from "../services/studentActivationService.js";
import { paystackService } from "../services/paystackService.js";
import { webhookEventService } from "../services/webhookEventService.js";

export const handlePaystackWebhook = async (req, res, next) => {
  try {
    const rawBody = req.rawBody || req.body;
    const payload = paystackService.parseWebhookPayload(rawBody, req.headers["x-paystack-signature"]);
    const providerEventId = payload?.data?.id || payload?.data?.reference
      ? `${payload?.event || "unknown"}:${payload.data.id || payload.data.reference}`
      : null;
    const eventKey = webhookEventService.eventKey({
      providerEventId,
      rawBody,
    });
    const reserved = await webhookEventService.reserve({ provider: "paystack", eventKey });
    if (!reserved) return res.status(200).json({ success: true, duplicate: true });

    let result;
    try {
      result = await financeService.processPaystackPayload(payload);
      await webhookEventService.complete("paystack", eventKey);
    } catch (error) {
      await webhookEventService.release("paystack", eventKey);
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
