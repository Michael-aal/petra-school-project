import { Router } from "express";
import { protect, requirePrincipal, requireRole, schoolGuard } from "../middleware/authMiddleware.js";
import { assignFeeStructure, createFeeStructure, createPayment, createPublicPayment, createSchoolPayment, deleteFeeStructure, deletePayment, getAdminWallet, getCashflow, getFeeStructures, getInvoices, getInstallmentPlans, getParentFees, getPublicStudentLookup, getSchoolStudentLookup, getPayment, getPaymentReceipt, listPayments, updateFeeStructure, updatePayment } from "../controllers/financeController.js";
import { listExpenseCategories, createExpense } from "../controllers/expenseController.js";
import { idValidator, listPaymentsValidator, paymentValidator, publicPaymentValidator, publicStudentLookupValidator, schoolStudentLookupValidator } from "../validators/financeValidator.js";
import { authorizeStudentResource } from "../middleware/authorizeResource.js";
import { paymentIdempotency } from "../middleware/idempotency.js";
import { requirePublicSchoolContext } from "../middleware/publicSchoolContext.js";

const router = Router();

router.get("/public/lookup", publicStudentLookupValidator, requirePublicSchoolContext("query"), getPublicStudentLookup);
router.post("/public/payments", publicPaymentValidator, requirePublicSchoolContext(), paymentIdempotency, createPublicPayment);

router.get("/payments/lookup", protect, schoolGuard, schoolStudentLookupValidator, getSchoolStudentLookup);
router.post("/payments/checkout", protect, schoolGuard, requireRole(["parent", "principal", "super_admin"]), paymentIdempotency, paymentValidator, authorizeStudentResource(), createSchoolPayment);

router.get("/payments", protect, schoolGuard, requirePrincipal, listPaymentsValidator, listPayments);
router.get("/payments/:id", protect, schoolGuard, requirePrincipal, idValidator, getPayment);
router.get("/payments/:id/receipt", protect, schoolGuard, idValidator, getPaymentReceipt);
router.post("/payments", protect, schoolGuard, requireRole(["parent", "principal", "super_admin"]), paymentIdempotency, paymentValidator, authorizeStudentResource(), createPayment);
router.put("/payments/:id", protect, schoolGuard, requirePrincipal, idValidator, paymentValidator, updatePayment);
router.delete("/payments/:id", protect, schoolGuard, requirePrincipal, idValidator, deletePayment);

router.get("/invoices", protect, schoolGuard, requirePrincipal, getInvoices);
router.get("/fees", protect, schoolGuard, requirePrincipal, listPaymentsValidator, getFeeStructures);
router.post("/fees", protect, schoolGuard, requirePrincipal, createFeeStructure);
router.put("/fees/:id", protect, schoolGuard, requirePrincipal, updateFeeStructure);
router.delete("/fees/:id", protect, schoolGuard, requirePrincipal, deleteFeeStructure);
router.post("/fees/assign", protect, schoolGuard, requirePrincipal, assignFeeStructure);
router.get("/flexpay", protect, schoolGuard, requirePrincipal, getInstallmentPlans);
router.get("/cashflow", protect, schoolGuard, requirePrincipal, getCashflow);
router.get("/expenses/categories", protect, schoolGuard, requireRole(["staff", "principal", "super_admin"]), listExpenseCategories);
router.post("/expenses", protect, schoolGuard, requireRole(["staff", "principal", "super_admin"]), createExpense);
router.get("/parent/fees", protect, authorizeStudentResource({ source: "query", allowMissing: true }), getParentFees);
router.get("/wallet/summary", protect, schoolGuard, requirePrincipal, getAdminWallet);

export default router;
