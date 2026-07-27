import { body, param, query } from "express-validator";

export const paymentValidator = [
  body("studentId").notEmpty().withMessage("Student is required"),
  body("amount").isFloat({ gt: 0 }).withMessage("Amount must be greater than zero"),
  body("method").notEmpty().withMessage("Payment method is required"),
  body("status").notEmpty().withMessage("Payment status is required"),
  body("paidAt").optional().isISO8601().withMessage("Paid date must be valid"),
];

export const idValidator = [param("id").notEmpty().withMessage("ID is required")];

export const listPaymentsValidator = [
  query("search").optional().trim(),
  query("studentId").optional().trim(),
  query("className").optional().trim(),
  query("method").optional().trim(),
  query("status").optional().trim(),
  query("date").optional().isISO8601().withMessage("Date must be valid"),
  query("startDate").optional().isISO8601().withMessage("Start date must be valid"),
  query("endDate").optional().isISO8601().withMessage("End date must be valid"),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
];
