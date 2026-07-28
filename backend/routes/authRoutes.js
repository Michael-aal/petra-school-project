import { Router } from "express";
import { body } from "express-validator";
import { changeUserPassword, createPendingStaff, createStaffInvitation, deleteUserAccount, getMe, getStaffInvitation, linkChild, listStaffInvitations, loginUser, logoutUser, activateStaff, registerParent, registerUser, regenerateStaffInvitationCode, revokeStaffInvitation, updateUserProfile } from "../controllers/authController.js";
import { loginValidator, registerValidator, staffInvitationValidator, staffActivationValidator } from "../validators/authValidator.js";
import { protect, requireParent, requirePrincipal } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", registerValidator, registerUser);
router.post("/staff/pending", protect, createPendingStaff);
router.post("/staff/activate", staffActivationValidator, activateStaff);
router.get("/staff/invitations", protect, requirePrincipal, listStaffInvitations);
router.get("/staff/invitations/:token", getStaffInvitation);
router.post("/staff/invitations", protect, requirePrincipal, staffInvitationValidator, createStaffInvitation);
router.post("/staff/invitations/revoke", protect, requirePrincipal, body("registrationCode").notEmpty().withMessage("Registration code is required"), revokeStaffInvitation);
router.post("/staff/invitations/regenerate", protect, requirePrincipal, body("registrationCode").notEmpty().withMessage("Registration code is required"), regenerateStaffInvitationCode);
router.post("/parent/register", registerParent);
router.post("/parent/link-child", protect, requireParent, body("accessCode").notEmpty().withMessage("Parent access code is required"), linkChild);
router.post("/login", loginValidator, loginUser);
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
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").isLength({ min: 8 }).withMessage("New password must be at least 8 characters long"),
  changeUserPassword,
);
router.post("/logout", protect, logoutUser);
router.delete(
  "/account",
  protect,
  body("password").notEmpty().withMessage("Current password is required"),
  deleteUserAccount,
);

export default router;
