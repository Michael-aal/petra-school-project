import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notificationController.js";

const router = Router();

router.get("/", protect, listNotifications);
router.post("/read-all", protect, markAllNotificationsRead);
router.post("/:id/read", protect, markNotificationRead);

export default router;
