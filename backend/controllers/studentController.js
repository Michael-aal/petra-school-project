import { studentService } from "../services/studentService.js";

const getPagination = (req) => ({
  page: req.query.page,
  limit: req.query.limit,
});

export const listStudents = async (req, res, next) => {
  try {
    const result = await studentService.list({
      ...getPagination(req),
      search: req.query.search || "",
      className: req.query.className || "",
      gender: req.query.gender || "",
      status: req.query.status || "",
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return next(error);
  }
};

export const getStudentById = async (req, res, next) => {
  try {
    const student = await studentService.getById(req.params.id);
    return res.status(200).json({ success: true, student });
  } catch (error) {
    return next(error);
  }
};

export const createStudent = async (req, res, next) => {
  try {
    const student = await studentService.create({
      ...req.body,
      schoolId: req.user?.schoolId,
    });

    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      student,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateStudent = async (req, res, next) => {
  try {
    const student = await studentService.update(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteStudent = async (req, res, next) => {
  try {
    const student = await studentService.remove(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Student removed successfully",
      student,
    });
  } catch (error) {
    return next(error);
  }
};

export const regenerateStudentAccessCode = async (req, res, next) => {
  try {
    const student = await studentService.generateParentAccessCode(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Parent access code regenerated successfully",
      student,
    });
  } catch (error) {
    return next(error);
  }
};

