import { financeService } from "../services/financeService.js";
import { activateAdmittedStudentAfterFeePayment } from "../services/studentActivationService.js";

export const handlePaystackWebhook = async (req, res, next) => {
  try {
    const rawBody = req.rawBody || req.body;
    const result = await financeService.processPaystackWebhook(
      rawBody,
      req.headers["x-paystack-signature"],
    );

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
