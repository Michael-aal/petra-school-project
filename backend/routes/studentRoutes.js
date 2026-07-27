import { Router } from "express";
import { validationResult } from "express-validator";
import { protect, requirePrincipal } from "../middleware/authMiddleware.js";
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

router.get("/", protect, requirePrincipal, listStudentsValidator, validate, listStudents);
router.get("/:id", protect, requirePrincipal, studentIdValidator, validate, getStudentById);
router.post("/", protect, requirePrincipal, createStudentValidator, validate, createStudent);
router.patch("/:id", protect, requirePrincipal, updateStudentValidator, validate, updateStudent);
router.delete("/:id", protect, requirePrincipal, studentIdValidator, validate, deleteStudent);
router.post("/:id/access-code", protect, requirePrincipal, studentIdValidator, validate, regenerateStudentAccessCode);

export default router;

