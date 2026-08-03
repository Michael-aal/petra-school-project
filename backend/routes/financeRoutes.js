import { Router } from "express";
import { protect, requirePrincipal, requireRole } from "../middleware/authMiddleware.js";
import { assignFeeStructure, createFeeStructure, createPayment, deleteFeeStructure, deletePayment, getAdminWallet, getCashflow, getFeeStructures, getInvoices, getInstallmentPlans, getParentFees, getPayment, getPaymentReceipt, listPayments, updateFeeStructure, updatePayment } from "../controllers/financeController.js";
import { idValidator, listPaymentsValidator, paymentValidator } from "../validators/financeValidator.js";

const router = Router();

router.get("/payments", protect, requirePrincipal, listPaymentsValidator, listPayments);
router.get("/payments/:id", protect, requirePrincipal, idValidator, getPayment);
router.get("/payments/:id/receipt", protect, idValidator, getPaymentReceipt);
router.post("/payments", protect, requireRole(["parent", "principal", "super_admin"]), paymentValidator, createPayment);
router.put("/payments/:id", protect, requirePrincipal, idValidator, paymentValidator, updatePayment);
router.delete("/payments/:id", protect, requirePrincipal, idValidator, deletePayment);

router.get("/invoices", protect, requirePrincipal, getInvoices);
router.get("/fees", protect, requirePrincipal, getFeeStructures);
router.post("/fees", protect, requirePrincipal, createFeeStructure);
router.put("/fees/:id", protect, requirePrincipal, updateFeeStructure);
router.delete("/fees/:id", protect, requirePrincipal, deleteFeeStructure);
router.post("/fees/assign", protect, requirePrincipal, assignFeeStructure);
router.get("/flexpay", protect, requirePrincipal, getInstallmentPlans);
router.get("/cashflow", protect, requirePrincipal, getCashflow);
router.get("/parent/fees", protect, getParentFees);
router.get("/wallet/summary", protect, requirePrincipal, getAdminWallet);

export default router;
