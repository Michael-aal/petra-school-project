import { enrollmentService } from "../services/enrollmentService.js";

export const getEnrollmentStats = async (req, res, next) => {
  try {
    const stats = await enrollmentService.getEnrollmentStats(req.user);
    return res.status(200).json({ success: true, stats });
  } catch (error) {
    return next(error);
  }
};

export const listEnrollments = async (req, res, next) => {
  try {
    const result = await enrollmentService.list({
      ...req.query,
      page: req.query.page,
      limit: req.query.limit,
    }, req.user);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return next(error);
  }
};

export const getEnrollmentById = async (req, res, next) => {
  try {
    const enrollment = await enrollmentService.getById(req.params.id, req.user);
    return res.status(200).json({ success: true, enrollment });
  } catch (error) {
    return next(error);
  }
};

export const createEnrollment = async (req, res, next) => {
  try {
    const enrollment = await enrollmentService.create({
      ...req.body,
      schoolId: req.user?.schoolId,
    });
    return res.status(201).json({ success: true, message: "Enrollment created successfully", enrollment });
  } catch (error) {
    return next(error);
  }
};

export const updateEnrollment = async (req, res, next) => {
  try {
    const enrollment = await enrollmentService.update(req.params.id, req.body, req.user);
    return res.status(200).json({ success: true, message: "Enrollment updated successfully", enrollment });
  } catch (error) {
    return next(error);
  }
};

export const deleteEnrollment = async (req, res, next) => {
  try {
    await enrollmentService.remove(req.params.id, req.user);
    return res.status(200).json({ success: true, message: "Enrollment deleted successfully" });
  } catch (error) {
    return next(error);
  }
};
