import { Router } from "express";
import { validationResult } from "express-validator";
import { protect, requirePrincipal } from "../middleware/authMiddleware.js";
import {
  createAdmission,
  listAdmissions,
  getAdmissionById,
  approveAdmission,
  rejectAdmission,
  enrollAdmission,
} from "../controllers/admissionController.js";
import { createAdmissionValidator } from "../validators/admissionValidator.js";

const router = Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  return next();
};

router.post("/", createAdmissionValidator, validate, createAdmission);
router.get("/", protect, requirePrincipal, listAdmissions);
router.get("/:id", protect, requirePrincipal, getAdmissionById);
router.patch("/:id/approve", protect, requirePrincipal, approveAdmission);
router.patch("/:id/reject", protect, requirePrincipal, rejectAdmission);
router.post("/:id/enroll", protect, requirePrincipal, enrollAdmission);

export default router;
