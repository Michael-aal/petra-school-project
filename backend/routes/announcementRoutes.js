import { Router } from "express";
import { protect, requirePrincipal } from "../middleware/authMiddleware.js";
import {
  listAnnouncements,
  createAnnouncement,
  markAnnouncementRead,
  reactToAnnouncement,
  announcementAnalytics,
} from "../controllers/announcementController.js";

const router = Router();

router.get("/", protect, listAnnouncements);
router.post("/", protect, requirePrincipal, createAnnouncement);
router.post("/:id/read", protect, markAnnouncementRead);
router.post("/:id/react", protect, reactToAnnouncement);
router.get("/:id/analytics", protect, requirePrincipal, announcementAnalytics);

export default router;
