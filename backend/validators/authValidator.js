import { body } from "express-validator";

const allowedRoles = ["principal", "staff", "parent"];

export const registerValidator = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(allowedRoles)
    .withMessage("Role must be principal, staff, or parent"),
];

export const loginValidator = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

export const staffInvitationValidator = [
  body("staffName").trim().notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("role").trim().notEmpty().withMessage("Staff role is required"),
  body("department").trim().notEmpty().withMessage("Department is required"),
  body("employmentStatus").optional().isIn(["active", "inactive"]).withMessage("Employment status must be active or inactive"),
];

export const staffActivationValidator = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
  body("code").trim().notEmpty().withMessage("Staff registration code is required"),
];
