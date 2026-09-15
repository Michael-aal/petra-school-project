import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/authMiddleware.js";
import {
  listKnowledge,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
} from "../controllers/nuvoraKnowledgeController.js";

const router = Router();
const developerOnly = [protect, requireRole(["developer", "superadmin", "super_admin"] )];

router.get("/", ...developerOnly, listKnowledge);
router.post("/", ...developerOnly, createKnowledge);
router.patch("/:id", ...developerOnly, updateKnowledge);
router.delete("/:id", ...developerOnly, deleteKnowledge);

export default router;
