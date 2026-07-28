import { Router } from "express";
import {
  getWallet,
  getTransactions,
  getStatement,
  withdrawWallet,
  transferWallet,
  initializePaystack,
} from "../controllers/walletController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", protect, requireRole(["student", "teacher", "parent", "principal", "super_admin"]), getWallet);
router.get("/transactions", protect, requireRole(["student", "teacher", "parent", "principal", "super_admin"]), getTransactions);
router.get("/statement", protect, requireRole(["student", "teacher", "parent", "principal", "super_admin"]), getStatement);
router.post("/withdraw", protect, requireRole(["student", "teacher", "parent", "principal", "super_admin"]), withdrawWallet);
router.post("/transfer", protect, requireRole(["student", "teacher", "parent", "principal", "super_admin"]), transferWallet);
router.post("/paystack/initialize", protect, requireRole(["student", "teacher", "parent", "principal", "super_admin"]), initializePaystack);

export default router;
