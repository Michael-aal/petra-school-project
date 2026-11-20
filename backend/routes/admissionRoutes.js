import { Router } from "express";
import { validationResult } from "express-validator";
import { protect, protectOptional, requireRole, schoolGuard } from "../middleware/authMiddleware.js";
import {
  createAdmission,
  listAdmissions,
  getAdmissionById,
  approveAdmission,
  rejectAdmission,
  enrollAdmission,
  completeStudentRecord,
} from "../controllers/admissionController.js";
import { createAdmissionValidator } from "../validators/admissionValidator.js";
import { requirePublicSchoolContext } from "../middleware/publicSchoolContext.js";

const router = Router();
const schoolAdmin = requireRole(["admin", "principal", "school_admin", "school_administrator", "super_admin", "superadmin"]);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  return next();
};

router.post("/", createAdmissionValidator, validate, protectOptional, requirePublicSchoolContext("body", "student"), createAdmission);
router.get("/", protect, schoolGuard, schoolAdmin, listAdmissions);
router.get("/:id", protect, schoolGuard, schoolAdmin, getAdmissionById);
router.patch("/:id/approve", protect, schoolGuard, schoolAdmin, approveAdmission);
router.patch("/:id/reject", protect, schoolGuard, schoolAdmin, rejectAdmission);
router.post("/:id/enroll", protect, schoolGuard, schoolAdmin, enrollAdmission);
router.post("/:id/complete-student", protect, schoolGuard, schoolAdmin, completeStudentRecord);

export default router;
