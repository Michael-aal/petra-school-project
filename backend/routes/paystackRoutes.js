import { Router } from "express";
import { handlePaystackWebhook } from "../controllers/paystackController.js";

const router = Router();

router.post("/webhook", handlePaystackWebhook);

export default router;
