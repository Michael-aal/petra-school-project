import { body, param, query } from "express-validator";

const studentStatusValues = ["active", "inactive", "suspended"];

export const listStudentsValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
];

export const studentIdValidator = [
  param("id").notEmpty().withMessage("Student ID is required"),
];

export const createStudentValidator = [
  body("name").notEmpty().withMessage("Student name is required"),
  body("admissionNumber").notEmpty().withMessage("Admission number is required"),
  body("parentEmail").optional().isEmail().withMessage("Parent email must be valid"),
  body("parentPhone").optional().isLength({ min: 7 }).withMessage("Parent phone must be valid"),
  body("status").optional().isIn(studentStatusValues).withMessage("Invalid student status"),
];

export const updateStudentValidator = [
  param("id").notEmpty().withMessage("Student ID is required"),
  body("parentEmail").optional({ values: "falsy" }).isEmail().withMessage("Parent email must be valid"),
  body("parentPhone").optional({ values: "falsy" }).isLength({ min: 7 }).withMessage("Parent phone must be valid"),
  body("status").optional().isIn(studentStatusValues).withMessage("Invalid student status"),
];

