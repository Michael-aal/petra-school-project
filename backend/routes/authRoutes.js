import { Router } from "express";
import { body } from "express-validator";
import { changeUserPassword, createPendingStaff, createStaffInvitation, deleteUserAccount, deactivateManagedTeacher, getMe, getStaffInvitation, linkChild, listManagedTeachers, listStaffInvitations, loginUser, logoutUser, revokeSession, revokeAllSessions, refreshSession, activateStaff, registerParent, registerUser, reactivateManagedTeacher, regenerateStaffInvitationCode, revokeStaffInvitation, selectSchool, updateUserProfile } from "../controllers/authController.js";
import { loginValidator, registerValidator, staffInvitationValidator, staffActivationValidator } from "../validators/authValidator.js";
import { protect, requireParent, requirePrincipal, requireRole, schoolGuard } from "../middleware/authMiddleware.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import crypto from "node:crypto";

const router = Router();

export const jwksHandler = (_req, res, next) => {
  try {
    const publicKey = String(process.env.JWT_PUBLIC_KEY || "").replace(/\\n/g, "\n");
    if (!publicKey) return res.status(503).json({ error: "JWKS unavailable" });
    const jwk = crypto.createPublicKey(publicKey).export({ format: "jwk" });
    return res.json({
      keys: [{ ...jwk, kid: process.env.JWT_KEY_ID || "petra-2026", alg: "RS256", use: "sig" }],
    });
  } catch (error) {
    return next(error);
  }
};

router.post("/register", authRateLimiter, registerValidator, registerUser);
router.post("/staff/pending", protect, schoolGuard, requirePrincipal, createPendingStaff);
router.post("/staff/activate", authRateLimiter, staffActivationValidator, activateStaff);
router.get("/staff/invitations", protect, schoolGuard, requirePrincipal, listStaffInvitations);
router.get("/staff/invitations/:token", getStaffInvitation);
router.post("/staff/invitations", protect, schoolGuard, requirePrincipal, staffInvitationValidator, createStaffInvitation);
router.post("/staff/invitations/revoke", protect, schoolGuard, requirePrincipal, body("registrationCode").notEmpty().withMessage("Registration code is required"), revokeStaffInvitation);
router.post("/staff/invitations/regenerate", protect, schoolGuard, requirePrincipal, body("registrationCode").notEmpty().withMessage("Registration code is required"), regenerateStaffInvitationCode);
router.get("/staff/teachers", protect, schoolGuard, requirePrincipal, listManagedTeachers);
router.patch("/staff/teachers/:teacherUserId/deactivate", protect, schoolGuard, requirePrincipal, deactivateManagedTeacher);
router.patch("/staff/teachers/:teacherUserId/reactivate", protect, schoolGuard, requirePrincipal, reactivateManagedTeacher);
router.post("/parent/register", authRateLimiter, registerParent);
router.post("/parent/link-child", protect, requireParent, body("accessCode").notEmpty().withMessage("Parent access code is required"), linkChild);
router.post(
  "/select-school",
  protect,
  requireRole(["super_admin"]),
  body("schoolId").notEmpty().withMessage("School ID is required"),
  selectSchool,
);
router.post("/login", authRateLimiter, loginValidator, loginUser);
router.post("/refresh", authRateLimiter, refreshSession);
router.get("/me", protect, getMe);
router.put(
  "/profile",
  protect,
  body("fullName").optional().trim().notEmpty().withMessage("Full name is required"),
  body("email").optional().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("phoneNumber").optional().trim(),
  body("profileImage").optional().trim(),
  body("password").optional().isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
  updateUserProfile,
);
router.post(
  "/change-password",
  protect,
  authRateLimiter,
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").isLength({ min: 8 }).withMessage("New password must be at least 8 characters long"),
  changeUserPassword,
);
router.post("/revoke", protect, revokeSession);
router.post("/logout", protect, logoutUser);
router.post("/logout-all", protect, revokeAllSessions);
router.delete(
  "/account",
  protect,
  body("password").notEmpty().withMessage("Current password is required"),
  deleteUserAccount,
);

export default router;
