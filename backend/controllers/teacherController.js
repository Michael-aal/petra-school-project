import { teacherService } from "../services/teacherService.js";

const parseBoolean = (value) => value === true || value === "true" || value === 1 || value === "1";

export const getTeacherDashboard = async (req, res, next) => {
  try {
    const data = await teacherService.getDashboard(req.user);
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

export const getTeacherClasses = async (req, res, next) => {
  try {
    const classes = await teacherService.listClasses(req.user);
    return res.status(200).json({ success: true, classes });
  } catch (error) {
    next(error);
  }
};

export const getTeacherClassById = async (req, res, next) => {
  try {
    const classData = await teacherService.getClassById(req.user, req.params.id);
    return res.status(200).json({ success: true, class: classData });
  } catch (error) {
    next(error);
  }
};

export const getTeacherStudents = async (req, res, next) => {
  try {
    const students = await teacherService.listStudents(req.user);
    return res.status(200).json({ success: true, students });
  } catch (error) {
    next(error);
  }
};

export const getTeacherProfile = async (req, res, next) => {
  try {
    const profile = await teacherService.getProfile(req.user);
    return res.status(200).json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};

export const updateTeacherProfile = async (req, res, next) => {
  try {
    const profile = await teacherService.updateProfile(req.user.id, req.body);
    return res.status(200).json({ success: true, message: "Profile updated", profile });
  } catch (error) {
    next(error);
  }
};

export const getTeacherAttendance = async (req, res, next) => {
  try {
    const attendance = await teacherService.listAttendance(req.user, req.query);
    return res.status(200).json({ success: true, attendance });
  } catch (error) {
    next(error);
  }
};

export const createTeacherAttendance = async (req, res, next) => {
  try {
    const attendance = await teacherService.createAttendance(req.user, req.body);
    return res.status(201).json({ success: true, message: "Attendance saved", attendance });
  } catch (error) {
    next(error);
  }
};

export const updateTeacherAttendance = async (req, res, next) => {
  try {
    const attendance = await teacherService.updateAttendance(req.user, req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Attendance updated", attendance });
  } catch (error) {
    next(error);
  }
};

export const getTeacherAssessments = async (req, res, next) => {
  try {
    const assessments = await teacherService.listAssessments(req.user, req.query);
    return res.status(200).json({ success: true, assessments });
  } catch (error) {
    next(error);
  }
};

export const createTeacherAssessment = async (req, res, next) => {
  try {
    const assessment = await teacherService.createAssessment(req.user, req.body);
    return res.status(201).json({ success: true, message: "Assessment created", assessment });
  } catch (error) {
    next(error);
  }
};

export const updateTeacherAssessment = async (req, res, next) => {
  try {
    const assessment = await teacherService.updateAssessment(req.user, req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Assessment updated", assessment });
  } catch (error) {
    next(error);
  }
};

export const deleteTeacherAssessment = async (req, res, next) => {
  try {
    const assessment = await teacherService.deleteAssessment(req.user, req.params.id);
    return res.status(200).json({ success: true, message: "Assessment deleted", assessment });
  } catch (error) {
    next(error);
  }
};

export const getTeacherResults = async (req, res, next) => {
  try {
    const results = await teacherService.listResults(req.user, req.query);
    return res.status(200).json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

export const createTeacherResult = async (req, res, next) => {
  try {
    const result = await teacherService.createResult(req.user, req.body);
    return res.status(201).json({ success: true, message: "Result saved", result });
  } catch (error) {
    next(error);
  }
};

export const updateTeacherResult = async (req, res, next) => {
  try {
    const result = await teacherService.updateResult(req.user, req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Result updated", result });
  } catch (error) {
    next(error);
  }
};

export const getTeacherAnnouncements = async (req, res, next) => {
  try {
    const announcements = await teacherService.listAnnouncements(req.user);
    return res.status(200).json({ success: true, announcements });
  } catch (error) {
    next(error);
  }
};

export const createTeacherAnnouncement = async (req, res, next) => {
  try {
    const announcement = await teacherService.createAnnouncement(req.user, req.body);
    return res.status(201).json({ success: true, message: "Announcement created", announcement });
  } catch (error) {
    next(error);
  }
};
