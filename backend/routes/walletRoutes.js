import { Router } from "express";
import {
  getWallet,
  getTransactions,
  getStatement,
  withdrawWallet,
  transferWallet,
  initializePaystack,
} from "../controllers/walletController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", protect, getWallet);
router.get("/transactions", protect, getTransactions);
router.get("/statement", protect, getStatement);
router.post("/withdraw", protect, withdrawWallet);
router.post("/transfer", protect, transferWallet);
router.post("/paystack/initialize", protect, initializePaystack);

export default router;
