import { prisma } from "../config/db.js";
import { parentAccessService } from "../services/parentAccessService.js";
import { normalizeRole } from "../utils/roleUtils.js";

const readStudentId = (req, source) => {
  if (source === "params") return req.params.id || req.params.studentId;
  if (source === "query") return req.query.studentId;
  return req.body?.studentId || req.params.studentId || req.params.id;
};

export const authorizeStudentResource = ({ source = "body", allowMissing = false } = {}) => async (req, res, next) => {
  const studentId = String(readStudentId(req, source) || "").trim();
  if (!studentId) {
    if (source === "body" && req.body?.paymentType === "application_fee" && req.body?.studentCode) return next();
    if (allowMissing) return next();
    return res.status(400).json({ success: false, message: "Student ID is required" });
  }

  try {
    const role = normalizeRole(req.user?.role);
    const schoolId = req.schoolId ?? req.user?.schoolId ?? null;

    if (["parent", "guardian"].includes(role)) {
      req.authorizedStudent = await parentAccessService.assertStudentAccess(req.user.id, studentId, schoolId);
      return next();
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, ...(schoolId ? { schoolId: Number(schoolId) } : {}) },
      select: { id: true, schoolId: true },
    });
    if (!student) {
      return res.status(403).json({ success: false, message: "You are not authorized to access this student" });
    }

    req.authorizedStudent = student;
    return next();
  } catch (error) {
    return next(error);
  }
};
