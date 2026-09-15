import { Router } from "express";
import { protect, schoolGuard, requireRole } from "../middleware/authMiddleware.js";
import { queryAI } from "../controllers/aiController.js";
import {
  listKnowledge,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
} from "../controllers/nuvoraKnowledgeController.js";
import {
  listNuvoraChats,
  getNuvoraChat,
  deleteNuvoraChat,
  deleteAllNuvoraChats,
  queryNuvora,
} from "../controllers/nuvoraChatController.js";

const router = Router();
const developerOnly = [protect, requireRole(["developer", "superadmin", "super_admin"] )];
const authenticated = [protect, schoolGuard];

// Persistent Nuvora chat history. Every operation is scoped to req.user.id.
router.get("/chats", ...authenticated, listNuvoraChats);
router.get("/chats/:id", ...authenticated, getNuvoraChat);
router.delete("/chats", ...authenticated, deleteAllNuvoraChats);
router.delete("/chats/:id", ...authenticated, deleteNuvoraChat);

// POST /api/ai/query
router.post("/query", ...authenticated, queryNuvora);

// Developer Nuvora training/knowledge management
router.get("/knowledge", ...developerOnly, listKnowledge);
router.post("/knowledge", ...developerOnly, createKnowledge);
router.patch("/knowledge/:id", ...developerOnly, updateKnowledge);
router.delete("/knowledge/:id", ...developerOnly, deleteKnowledge);

export default router;
