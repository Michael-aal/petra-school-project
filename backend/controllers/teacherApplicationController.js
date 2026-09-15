import { teacherApplicationService } from "../services/teacherApplicationService.js";

export const createTeacherApplication = async (req, res, next) => {
  try {
    const result = await teacherApplicationService.create({
      schoolId: req.schoolId,
      payload: req.body || {},
    });
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    return next(error);
  }
};
