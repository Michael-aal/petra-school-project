import { Router } from "express";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import { addMessage, createTicket, getTicket, listTickets, updateTicket } from "../controllers/supportController.js";

const router = Router();
const authenticated = [protect];
const supportManagers = [protect, requireRole(["admin","principal","super_admin","developer"])];

router.get("/", ...authenticated, listTickets);
router.post("/", ...authenticated, createTicket);
router.get("/:id", ...authenticated, getTicket);
router.post("/:id/messages", ...authenticated, addMessage);
router.patch("/:id", ...supportManagers, updateTicket);

export default router;
