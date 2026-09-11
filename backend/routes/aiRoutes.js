import { Router } from "express";
import { protect, schoolGuard } from "../middleware/authMiddleware.js";
import { queryAI } from "../controllers/aiController.js";

const router = Router();

// POST /api/ai/query
router.post("/query", protect, schoolGuard, queryAI);

export default router;
