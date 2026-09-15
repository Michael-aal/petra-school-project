import { Router } from "express";
import { protect, schoolGuard, requireRole } from "../middleware/authMiddleware.js";
import { queryAI } from "../controllers/aiController.js";
import {
  listKnowledge,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
} from "../controllers/nuvoraKnowledgeController.js";

const router = Router();
const developerOnly = [protect, requireRole(["developer", "superadmin", "super_admin"] )];

// POST /api/ai/query
router.post("/query", protect, schoolGuard, queryAI);

// Developer Nuvora training/knowledge management
router.get("/knowledge", ...developerOnly, listKnowledge);
router.post("/knowledge", ...developerOnly, createKnowledge);
router.patch("/knowledge/:id", ...developerOnly, updateKnowledge);
router.delete("/knowledge/:id", ...developerOnly, deleteKnowledge);

export default router;
