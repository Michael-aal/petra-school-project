import { Router } from "express";
import { protect, requirePrincipal } from "../middleware/authMiddleware.js";
import {
  getAdminDashboard,
  listAdmins,
  listAuditLogs,
  listRoles,
  listStaffAttendance,
  listTeachers,
  listUsers,
  listResults,
} from "../controllers/adminController.js";
import {
  adminAttendanceListValidator,
  adminUserListValidator,
} from "../validators/adminValidator.js";
import {
  assignClassSubject,
  assignTeacherClass,
  assignTeacherSubject,
  listReportCards,
  listTeacherAssignments,
  publishReportCard,
  removeClassSubject,
  removeTeacherClass,
} from "../controllers/schoolConnectionController.js";

const router = Router();

router.get("/dashboard", protect, requirePrincipal, getAdminDashboard);
router.get(
  "/users",
  protect,
  requirePrincipal,
  adminUserListValidator,
  listUsers,
);
router.get(
  "/teachers",
  protect,
  requirePrincipal,
  adminUserListValidator,
  listTeachers,
);
router.get("/admins", protect, requirePrincipal, listAdmins);
router.get(
  "/staff-attendance",
  protect,
  requirePrincipal,
  adminAttendanceListValidator,
  listStaffAttendance,
);
router.get("/roles", protect, requirePrincipal, listRoles);
router.get(
  "/audit-logs",
  protect,
  requirePrincipal,
  adminAttendanceListValidator,
  listAuditLogs,
);
router.get("/results", protect, requirePrincipal, listResults);
// Relational school connections used by the admin, staff, and parent dashboards.
router.get(
  "/teacher-assignments",
  protect,
  requirePrincipal,
  listTeacherAssignments,
);
router.post(
  "/teacher-assignments/classes",
  protect,
  requirePrincipal,
  assignTeacherClass,
);
router.delete(
  "/teacher-assignments/classes/:id",
  protect,
  requirePrincipal,
  removeTeacherClass,
);
router.post(
  "/teacher-assignments/subjects",
  protect,
  requirePrincipal,
  assignTeacherSubject,
);
router.post("/class-subjects", protect, requirePrincipal, assignClassSubject);
router.delete(
  "/class-subjects/:id",
  protect,
  requirePrincipal,
  removeClassSubject,
);
router.get("/report-cards", protect, requirePrincipal, listReportCards);
router.patch(
  "/report-cards/:id/publish",
  protect,
  requirePrincipal,
  publishReportCard,
);
export default router;
