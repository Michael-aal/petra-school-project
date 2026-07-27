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
} from "../controllers/adminController.js";
import { adminAttendanceListValidator, adminUserListValidator } from "../validators/adminValidator.js";

const router = Router();

router.get("/dashboard", protect, requirePrincipal, getAdminDashboard);
router.get("/users", protect, requirePrincipal, adminUserListValidator, listUsers);
router.get("/teachers", protect, requirePrincipal, adminUserListValidator, listTeachers);
router.get("/admins", protect, requirePrincipal, listAdmins);
router.get("/staff-attendance", protect, requirePrincipal, adminAttendanceListValidator, listStaffAttendance);
router.get("/roles", protect, requirePrincipal, listRoles);
router.get("/audit-logs", protect, requirePrincipal, adminAttendanceListValidator, listAuditLogs);

export default router;
