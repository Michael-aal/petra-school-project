import { validationResult } from "express-validator";
import { academicService } from "../services/academicService.js";

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  return null;
};

export const getSessions = async (req, res, next) => {
  try {
    return res.json({ success: true, sessions: await academicService.listSessions(req.user) });
  } catch (error) { next(error); }
};
export const createSession = async (req, res, next) => {
  try {
    const invalid = validate(req, res); if (invalid) return invalid;
    return res.status(201).json({ success: true, session: await academicService.createSession(req.user, req.body) });
  } catch (error) { next(error); }
};
export const updateSession = async (req, res, next) => {
  try {
    const invalid = validate(req, res); if (invalid) return invalid;
    return res.json({ success: true, session: await academicService.updateSession(req.user, req.params.id, req.body) });
  } catch (error) { next(error); }
};
export const deleteSession = async (req, res, next) => { try { await academicService.deleteSession(req.user, req.params.id); return res.json({ success: true }); } catch (error) { next(error); } };

export const getClasses = async (req, res, next) => { try { return res.json({ success: true, classes: await academicService.listClasses(req.user) }); } catch (error) { next(error); } };
export const createClass = async (req, res, next) => { try { const invalid = validate(req, res); if (invalid) return invalid; return res.status(201).json({ success: true, class: await academicService.createClass(req.user, req.body) }); } catch (error) { next(error); } };
export const updateClass = async (req, res, next) => { try { const invalid = validate(req, res); if (invalid) return invalid; return res.json({ success: true, class: await academicService.updateClass(req.user, req.params.id, req.body) }); } catch (error) { next(error); } };
export const deleteClass = async (req, res, next) => { try { await academicService.deleteClass(req.user, req.params.id); return res.json({ success: true }); } catch (error) { next(error); } };

export const getSubjects = async (req, res, next) => { try { return res.json({ success: true, subjects: await academicService.listSubjects(req.user) }); } catch (error) { next(error); } };
export const createSubject = async (req, res, next) => { try { const invalid = validate(req, res); if (invalid) return invalid; return res.status(201).json({ success: true, subject: await academicService.createSubject(req.user, req.body) }); } catch (error) { next(error); } };
export const updateSubject = async (req, res, next) => { try { const invalid = validate(req, res); if (invalid) return invalid; return res.json({ success: true, subject: await academicService.updateSubject(req.user, req.params.id, req.body) }); } catch (error) { next(error); } };
export const deleteSubject = async (req, res, next) => { try { await academicService.deleteSubject(req.user, req.params.id); return res.json({ success: true }); } catch (error) { next(error); } };

export const getTimetable = async (req, res, next) => { try { return res.json({ success: true, timetable: await academicService.listTimetable(req.user) }); } catch (error) { next(error); } };
export const createTimetable = async (req, res, next) => { try { const invalid = validate(req, res); if (invalid) return invalid; return res.status(201).json({ success: true, entry: await academicService.createTimetable(req.user, req.body) }); } catch (error) { next(error); } };
export const updateTimetable = async (req, res, next) => { try { const invalid = validate(req, res); if (invalid) return invalid; return res.json({ success: true, entry: await academicService.updateTimetable(req.user, req.params.id, req.body) }); } catch (error) { next(error); } };
export const deleteTimetable = async (req, res, next) => { try { await academicService.deleteTimetable(req.user, req.params.id); return res.json({ success: true }); } catch (error) { next(error); } };

export const getAttendance = async (req, res, next) => {
  try {
    return res.json({ success: true, ...(await academicService.listAttendance(req.user, req.query)) });
  } catch (error) {
    next(error);
  }
};
