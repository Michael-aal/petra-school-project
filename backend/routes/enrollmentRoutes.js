import { Router } from "express";
import { validationResult } from "express-validator";
import { protect, requirePrincipal } from "../middleware/authMiddleware.js";
import {
  createEnrollment,
  deleteEnrollment,
  getEnrollmentById,
  getEnrollmentStats,
  listEnrollments,
  updateEnrollment,
} from "../controllers/enrollmentController.js";
import {
  createEnrollmentValidator,
  enrollmentIdValidator,
  listEnrollmentsValidator,
  updateEnrollmentValidator,
} from "../validators/enrollmentValidator.js";

const router = Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  return next();
};

router.get("/stats", protect, requirePrincipal, getEnrollmentStats);
router.get("/", protect, requirePrincipal, listEnrollmentsValidator, validate, listEnrollments);
router.get("/:id", protect, requirePrincipal, enrollmentIdValidator, validate, getEnrollmentById);
router.post("/", protect, requirePrincipal, createEnrollmentValidator, validate, createEnrollment);
router.patch("/:id", protect, requirePrincipal, enrollmentIdValidator, updateEnrollmentValidator, validate, updateEnrollment);
router.delete("/:id", protect, requirePrincipal, enrollmentIdValidator, validate, deleteEnrollment);

export default router;
