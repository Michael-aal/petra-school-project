import { Router } from "express";
import { protect, requirePrincipal } from "../middleware/authMiddleware.js";
import { createPayment, deletePayment, getCashflow, getFeeStructures, getInvoices, getInstallmentPlans, getPayment, listPayments, updatePayment } from "../controllers/financeController.js";
import { idValidator, listPaymentsValidator, paymentValidator } from "../validators/financeValidator.js";

const router = Router();

router.get("/payments", protect, requirePrincipal, listPaymentsValidator, listPayments);
router.get("/payments/:id", protect, requirePrincipal, idValidator, getPayment);
router.post("/payments", protect, requirePrincipal, paymentValidator, createPayment);
router.put("/payments/:id", protect, requirePrincipal, idValidator, paymentValidator, updatePayment);
router.delete("/payments/:id", protect, requirePrincipal, idValidator, deletePayment);

router.get("/invoices", protect, requirePrincipal, getInvoices);
router.get("/fees", protect, requirePrincipal, getFeeStructures);
router.get("/flexpay", protect, requirePrincipal, getInstallmentPlans);
router.get("/cashflow", protect, requirePrincipal, getCashflow);

export default router;
