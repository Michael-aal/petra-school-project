import { Router } from "express";
import { protect, requireRole, schoolGuard } from "../middleware/authMiddleware.js";
import { requirePublicSchoolContext } from "../middleware/publicSchoolContext.js";
import {
  createTeacherApplication,
  listTeacherApplications,
  getTeacherApplication,
  updateTeacherApplicationStatus,
} from "../controllers/teacherApplicationController.js";

const router = Router();
const schoolAdmin = requireRole(["principal", "super_admin", "superadmin"]);

// Public application submission.
router.post("/", requirePublicSchoolContext("body"), createTeacherApplication);

// School administration review workflow.
router.get("/", protect, schoolGuard, schoolAdmin, listTeacherApplications);
router.get("/:id", protect, schoolGuard, schoolAdmin, getTeacherApplication);
router.patch("/:id/status", protect, schoolGuard, schoolAdmin, updateTeacherApplicationStatus);

export default router;
