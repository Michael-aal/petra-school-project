import { Router } from "express";
import { validationResult } from "express-validator";
import { protect, requirePrincipal, schoolGuard } from "../middleware/authMiddleware.js";
import {
  createStudent,
  deleteStudent,
  getStudentById,
  listStudents,
  regenerateStudentAccessCode,
  updateStudent,
} from "../controllers/studentController.js";
import {
  createStudentValidator,
  listStudentsValidator,
  studentIdValidator,
  updateStudentValidator,
} from "../validators/studentValidator.js";

const router = Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  return next();
};

router.get("/", protect, schoolGuard, requirePrincipal, listStudentsValidator, validate, listStudents);
router.get("/:id", protect, schoolGuard, requirePrincipal, studentIdValidator, validate, getStudentById);
router.post("/", protect, schoolGuard, requirePrincipal, createStudentValidator, validate, createStudent);
router.patch("/:id", protect, schoolGuard, requirePrincipal, updateStudentValidator, validate, updateStudent);
router.delete("/:id", protect, schoolGuard, requirePrincipal, studentIdValidator, validate, deleteStudent);
router.post("/:id/access-code", protect, schoolGuard, requirePrincipal, studentIdValidator, validate, regenerateStudentAccessCode);

export default router;

