import { body, param, query } from "express-validator";

export const sessionValidator = [
  body("name").notEmpty().withMessage("Session name is required"),
  body("term").notEmpty().withMessage("Term is required"),
  body("startsAt").isISO8601().withMessage("Valid start date is required"),
  body("endsAt").isISO8601().withMessage("Valid end date is required"),
];

export const classValidator = [
  body("name").notEmpty().withMessage("Class name is required"),
];

export const subjectValidator = [
  body("name").notEmpty().withMessage("Subject name is required"),
];

export const timetableValidator = [
  body("className").notEmpty().withMessage("Class name is required"),
  body("subjectName").notEmpty().withMessage("Subject name is required"),
  body("dayOfWeek").notEmpty().withMessage("Day of week is required"),
  body("startTime").notEmpty().withMessage("Start time is required"),
  body("endTime").notEmpty().withMessage("End time is required"),
];

export const idValidator = [param("id").notEmpty().withMessage("ID is required")];

export const listAttendanceValidator = [
  query("className").optional().trim(),
  query("status").optional().trim(),
  query("search").optional().trim(),
  query("student").optional().trim(),
  query("teacher").optional().trim(),
  query("subject").optional().trim(),
  query("date").optional().isISO8601().withMessage("Date must be valid"),
  query("startDate").optional().isISO8601().withMessage("Start date must be valid"),
  query("endDate").optional().isISO8601().withMessage("End date must be valid"),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
];
