import { normalizeRole } from "../utils/roleUtils.js";

const parseSchoolId = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const tenantGuard = (req, res, next) => {
  const requestedSchoolId = parseSchoolId(req.get("x-school-id") ?? req.body?.schoolId ?? req.query?.schoolId ?? req.schoolId ?? req.user?.schoolId);
  const currentSchoolId = parseSchoolId(req.schoolId ?? req.user?.schoolId ?? req.user?.selectedSchoolId);

  if (!currentSchoolId && !requestedSchoolId) {
    return res.status(403).json({ success: false, message: "School context is required for this request." });
  }

  const effectiveSchoolId = requestedSchoolId ?? currentSchoolId;
  const role = normalizeRole(req.user?.role);

  if (role !== "super_admin" && effectiveSchoolId !== currentSchoolId) {
    return res.status(403).json({ success: false, message: "Access denied: school mismatch." });
  }

  if (!Number.isInteger(effectiveSchoolId) || effectiveSchoolId <= 0) {
    return res.status(403).json({ success: false, message: "Invalid school context." });
  }

  req.schoolId = effectiveSchoolId;
  req.user.schoolId = effectiveSchoolId;
  return next();
};
