import { Router } from "express";
import { protect, requirePrincipal, requireRole, schoolGuard } from "../middleware/authMiddleware.js";
import { assignFeeStructure, createFeeStructure, createPayment, deleteFeeStructure, deletePayment, getAdminWallet, getCashflow, getFeeStructures, getInvoices, getInstallmentPlans, getParentFees, getPayment, getPaymentReceipt, listPayments, updateFeeStructure, updatePayment } from "../controllers/financeController.js";
import { idValidator, listPaymentsValidator, paymentValidator } from "../validators/financeValidator.js";

const router = Router();

router.get("/payments", protect, schoolGuard, requirePrincipal, listPaymentsValidator, listPayments);
router.get("/payments/:id", protect, schoolGuard, requirePrincipal, idValidator, getPayment);
router.get("/payments/:id/receipt", protect, idValidator, getPaymentReceipt);
router.post("/payments", protect, schoolGuard, requireRole(["parent", "principal", "super_admin"]), paymentValidator, createPayment);
router.put("/payments/:id", protect, schoolGuard, requirePrincipal, idValidator, paymentValidator, updatePayment);
router.delete("/payments/:id", protect, schoolGuard, requirePrincipal, idValidator, deletePayment);

router.get("/invoices", protect, schoolGuard, requirePrincipal, getInvoices);
router.get("/fees", protect, schoolGuard, requirePrincipal, getFeeStructures);
router.post("/fees", protect, schoolGuard, requirePrincipal, createFeeStructure);
router.put("/fees/:id", protect, schoolGuard, requirePrincipal, updateFeeStructure);
router.delete("/fees/:id", protect, schoolGuard, requirePrincipal, deleteFeeStructure);
router.post("/fees/assign", protect, schoolGuard, requirePrincipal, assignFeeStructure);
router.get("/flexpay", protect, schoolGuard, requirePrincipal, getInstallmentPlans);
router.get("/cashflow", protect, schoolGuard, requirePrincipal, getCashflow);
router.get("/parent/fees", protect, getParentFees);
router.get("/wallet/summary", protect, schoolGuard, requirePrincipal, getAdminWallet);

export default router;
