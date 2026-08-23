import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/query", protect, (_req, res) => {
  return res.status(503).json({
    success: false,
    message: "AI service is not configured",
  });
});

export default router;
