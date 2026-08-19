import { body, param, query } from "express-validator";

export const createEnrollmentValidator = [
  body("studentId").notEmpty().withMessage("Student ID is required"),
  body("status").optional().isString().withMessage("Status must be a string"),
];

export const updateEnrollmentValidator = [
  param("id").notEmpty().withMessage("Enrollment ID is required"),
  body("status").optional().isString().withMessage("Status must be a string"),
];

export const enrollmentIdValidator = [
  param("id").notEmpty().withMessage("Enrollment ID is required"),
];

export const listEnrollmentsValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
  query("status").optional().isString().withMessage("Status must be a string"),
  query("search").optional().isString().withMessage("Search must be a string"),
];
