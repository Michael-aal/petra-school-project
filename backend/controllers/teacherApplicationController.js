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

export const listTeacherApplications = async (req, res, next) => {
  try {
    const applications = await teacherApplicationService.list({
      schoolId: req.schoolId,
      status: req.query.status,
      query: req.query.q,
      limit: req.query.limit,
    });
    return res.json({ success: true, applications });
  } catch (error) {
    return next(error);
  }
};

export const getTeacherApplication = async (req, res, next) => {
  try {
    const application = await teacherApplicationService.getById({
      schoolId: req.schoolId,
      id: req.params.id,
    });
    return res.json({ success: true, application });
  } catch (error) {
    return next(error);
  }
};

export const updateTeacherApplicationStatus = async (req, res, next) => {
  try {
    const application = await teacherApplicationService.updateStatus({
      schoolId: req.schoolId,
      id: req.params.id,
      status: req.body?.status,
    });
    return res.json({ success: true, application });
  } catch (error) {
    return next(error);
  }
};
