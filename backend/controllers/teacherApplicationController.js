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
      id: req.params.id,
      status: req.body?.status,
      schoolId: req.schoolId,
    });
    return res.json({ success: true, application });
  } catch (error) {
    return next(error);
  }
};
