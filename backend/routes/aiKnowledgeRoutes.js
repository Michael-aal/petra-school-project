import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import * as controller from "../controllers/aiKnowledgeController.js";

const router = express.Router();
const developerOnly = (req, res, next) => {
  const role = String(req.user?.role || "").toLowerCase().replace(/\s+/g, "_");
  if (!["developer", "super_admin", "superadmin"].includes(role)) return res.status(403).json({ success: false, message: "Developer access required" });
  next();
};

router.use(protect, developerOnly);
router.get("/", controller.list);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
