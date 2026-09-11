import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { listMessages, sendMessage, getConversation } from "../controllers/messageController.js";
import { messageValidators } from "../validators/messageValidator.js";

const router = Router();

router.get("/", protect, messageValidators.listMessages, listMessages);
router.get("/conversation/:id", protect, messageValidators.conversation, getConversation);
router.post("/", protect, messageValidators.sendMessage, sendMessage);

export default router;
