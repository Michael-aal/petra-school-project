import { Router } from "express";
import { protect, requirePrincipal } from "../middleware/authMiddleware.js";
import {
  classValidator,
  idValidator,
  listAttendanceValidator,
  sessionValidator,
  subjectValidator,
  timetableValidator,
} from "../validators/academicValidator.js";
import {
  createClass,
  createSession,
  createSubject,
  createTimetable,
  deleteClass,
  deleteSession,
  deleteSubject,
  deleteTimetable,
  getAttendance,
  getClasses,
  getSessions,
  getSubjects,
  getTimetable,
  updateClass,
  updateSession,
  updateSubject,
  updateTimetable,
} from "../controllers/academicController.js";

const router = Router();

router.get("/sessions", protect, requirePrincipal, getSessions);
router.post("/sessions", protect, requirePrincipal, sessionValidator, createSession);
router.put("/sessions/:id", protect, requirePrincipal, idValidator, sessionValidator, updateSession);
router.delete("/sessions/:id", protect, requirePrincipal, idValidator, deleteSession);

router.get("/classes", protect, requirePrincipal, getClasses);
router.post("/classes", protect, requirePrincipal, classValidator, createClass);
router.put("/classes/:id", protect, requirePrincipal, idValidator, classValidator, updateClass);
router.delete("/classes/:id", protect, requirePrincipal, idValidator, deleteClass);

router.get("/subjects", protect, requirePrincipal, getSubjects);
router.post("/subjects", protect, requirePrincipal, subjectValidator, createSubject);
router.put("/subjects/:id", protect, requirePrincipal, idValidator, subjectValidator, updateSubject);
router.delete("/subjects/:id", protect, requirePrincipal, idValidator, deleteSubject);

router.get("/timetable", protect, requirePrincipal, getTimetable);
router.post("/timetable", protect, requirePrincipal, timetableValidator, createTimetable);
router.put("/timetable/:id", protect, requirePrincipal, idValidator, timetableValidator, updateTimetable);
router.delete("/timetable/:id", protect, requirePrincipal, idValidator, deleteTimetable);

router.get("/attendance", protect, requirePrincipal, listAttendanceValidator, getAttendance);

export default router;
