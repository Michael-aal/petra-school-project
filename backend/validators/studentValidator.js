import { body, param, query } from "express-validator";

const studentStatusValues = ["active", "inactive", "suspended"];

export const listStudentsValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 200 }).withMessage("Limit must be between 1 and 200"),
];

export const studentIdValidator = [
  param("id").notEmpty().withMessage("Student ID is required"),
];

export const createStudentValidator = [
  body("name").notEmpty().withMessage("Student name is required"),
  body("gender").optional().isIn(["Male", "Female", "male", "female"]).withMessage("Invalid gender"),
  body("className").optional().trim(),
  body("sessionId").optional().trim(),
  body("status").optional().isIn(studentStatusValues).withMessage("Invalid student status"),
  body("parentName").notEmpty().withMessage("Parent name is required"),
  body("parentRelationship").notEmpty().withMessage("Relationship is required"),
  body("parentEmail").isEmail().withMessage("Parent email must be valid"),
  body("parentPhone").notEmpty().withMessage("Parent phone is required"),
  body("parentAltPhone").optional().isLength({ min: 7 }).withMessage("Alternative phone must be valid"),
  body("parentAddress").optional().trim(),
  body("passportPhoto").optional().trim(),
  body("bloodGroup").optional().trim(),
  body("house").optional().trim(),
  body("nationality").optional().trim(),
  body("religion").optional().trim(),
  body("medicalNotes").optional().trim(),
  body("previousSchool").optional().trim(),
  body("studentAddress").optional().trim(),
  body("status").optional().isIn(studentStatusValues).withMessage("Invalid student status"),
];

export const updateStudentValidator = [
  param("id").notEmpty().withMessage("Student ID is required"),
  body("name").optional().trim(),
  body("parentEmail").optional({ values: "falsy" }).isEmail().withMessage("Parent email must be valid"),
  body("parentPhone").optional({ values: "falsy" }).isLength({ min: 7 }).withMessage("Parent phone must be valid"),
  body("status").optional().isIn(studentStatusValues).withMessage("Invalid student status"),
];

