import { walletService } from "../services/walletService.js";

export const handlePaystackWebhook = async (req, res, next) => {
  try {
    const rawBody = req.rawBody || req.body;
    const result = await walletService.processPaystackWebhook(rawBody, req.headers["x-paystack-signature"]);
    return res.status(200).json({ success: true, result });
  } catch (error) {
    next(error);
  }
};
