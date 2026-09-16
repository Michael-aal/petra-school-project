import { Router } from "express";
import {
  getWallet,
  getTransactions,
  getStatement,
  setWithdrawalPin,
  withdrawWallet,
  transferWallet,
  initializePaystack,
} from "../controllers/walletController.js";
import {
  getSchoolPaymentAccount,
  setupSchoolPaymentAccount,
} from "../controllers/schoolPaymentAccountController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = Router();
const walletRoles = ["student", "teacher", "parent", "principal", "super_admin"];
const schoolFinanceRoles = ["principal", "super_admin"];

router.get("/", protect, requireRole(walletRoles), getWallet);
router.get("/transactions", protect, requireRole(walletRoles), getTransactions);
router.get("/statement", protect, requireRole(walletRoles), getStatement);
router.post("/withdrawal-pin", protect, requireRole(walletRoles), setWithdrawalPin);
router.post("/withdraw", protect, requireRole(walletRoles), withdrawWallet);
router.post("/transfer", protect, requireRole(walletRoles), transferWallet);
router.post("/paystack/initialize", protect, requireRole(walletRoles), initializePaystack);

// School-level provider account. The schoolId is always derived from req.user.schoolId.
router.get("/school-payment-account", protect, requireRole(schoolFinanceRoles), getSchoolPaymentAccount);
router.post("/school-payment-account", protect, requireRole(schoolFinanceRoles), setupSchoolPaymentAccount);

export default router;
