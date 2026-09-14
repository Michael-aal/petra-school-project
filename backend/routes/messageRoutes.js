import { Router } from "express";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import { listMessages, sendMessage, getConversation } from "../controllers/messageController.js";
import { messageValidators } from "../validators/messageValidator.js";
import { addMessage, createTicket, getTicket, listTickets, updateTicket } from "../controllers/supportController.js";

const router = Router();

router.get("/", protect, messageValidators.listMessages, listMessages);
router.get("/conversation/:id", protect, messageValidators.conversation, getConversation);
router.post("/", protect, messageValidators.sendMessage, sendMessage);

// Platform support lives under the existing authenticated communication router so no new app mount is required.
router.get("/support", protect, listTickets);
router.post("/support", protect, createTicket);
router.get("/support/:id", protect, getTicket);
router.post("/support/:id/messages", protect, addMessage);
router.patch("/support/:id", protect, requireRole(["admin", "principal", "super_admin", "developer"]), updateTicket);

export default router;
