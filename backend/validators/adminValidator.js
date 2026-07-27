import { body, query } from "express-validator";

export const adminUserListValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
  query("role").optional().isString().trim(),
  query("search").optional().isString().trim(),
];

export const adminAttendanceListValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
  query("search").optional().isString().trim(),
];

export const adminUpdateUserValidator = [
  body("fullName").optional().isString().trim().notEmpty().withMessage("Full name cannot be empty"),
  body("firstName").optional().isString().trim().notEmpty().withMessage("First name cannot be empty"),
  body("middleName").optional().isString().trim(),
  body("lastName").optional().isString().trim().notEmpty().withMessage("Last name cannot be empty"),
  body("username").optional().isString().trim().notEmpty().withMessage("Username cannot be empty"),
  body("email").optional().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("phone").optional().isString().trim(),
  body("role").optional().isString().trim().notEmpty().withMessage("Role cannot be empty"),
  body("accountStatus").optional().isString().trim().notEmpty().withMessage("Account status cannot be empty"),
];
