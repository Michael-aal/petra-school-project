import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  listNotifications,
  unreadNotificationSummary,
  markNotificationSectionRead,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notificationController.js";

const router = Router();

router.get("/", protect, listNotifications);
router.get("/unread-summary", protect, unreadNotificationSummary);
router.post("/section/:section/read", protect, markNotificationSectionRead);
router.post("/read-all", protect, markAllNotificationsRead);
router.post("/:id/read", protect, markNotificationRead);

export default router;
