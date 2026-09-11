import { Router } from "express";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import {
  createSchool,
  deleteSchool,
  getSchool,
  getSchools,
  updateSchool,
} from "../controllers/schoolController.js";

const router = Router();

router.post("/", protect, requireRole(["superadmin"]), createSchool);
router.get("/", protect, requireRole(["superadmin"]), getSchools);
router.get("/:id", protect, requireRole(["superadmin", "principal"]), getSchool);
router.put("/:id", protect, requireRole(["superadmin", "principal"]), updateSchool);
router.delete("/:id", protect, requireRole(["superadmin"]), deleteSchool);

export default router;

