import { body, param, query } from "express-validator";

export const paymentValidator = [
  body("studentId").custom((value, { req }) => {
    if (req.body.paymentType === "application_fee") return true;
    if (!value) throw new Error("Student is required");
    return true;
  }),
  body("studentCode").custom((value, { req }) => {
    if (req.body.paymentType !== "application_fee") return true;
    if (!value) throw new Error("Student Code is required");
    return true;
  }),
  body("amount").custom((value, { req }) => {
    if (req.body.paymentType === "application_fee") return true;
    if (value === undefined || value === null || !Number.isFinite(Number(value)) || Number(value) <= 0) {
      throw new Error("Amount must be greater than zero");
    }
    return true;
  }),
  body("paymentType").optional().isIn(["application_fee", "school_fee"]).withMessage("Payment type must be valid"),
  body("method").optional().trim(),
  body("status").optional().trim(),
  body("invoiceIds").optional().isArray(),
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
  query("page").optional().isInt({ min: 1 }).toInt().withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt().withMessage("Limit must be between 1 and 100"),
];

export const publicStudentLookupValidator = [
  query("studentCode").trim().notEmpty().withMessage("Student Code is required"),
];

export const publicPaymentValidator = [
  body("studentCode").trim().notEmpty().withMessage("Student Code is required"),
  body("feeItems").isArray({ min: 1 }).withMessage("At least one payment item is required"),
  body("feeItems.*.feeStructureId").trim().notEmpty().withMessage("Payment item is required"),
  body("feeItems.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("callbackUrl").optional().isURL({ protocols: ["http", "https"], require_protocol: true }).withMessage("Callback URL must be valid"),
];
