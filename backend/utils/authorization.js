import { prisma } from "../config/db.js";
import { ForbiddenError } from "./errors.js";
import { normalizeRole } from "./roleUtils.js";

export const isAuthenticated = (user) => Boolean(user?.id);

export const hasRole = (user, roles = []) => {
  const allowed = (Array.isArray(roles) ? roles : [roles]).map(normalizeRole);
  return allowed.length === 0 || allowed.includes(normalizeRole(user?.role));
};

export const getSchoolId = (user) => {
  const schoolId = Number(user?.schoolId);
  return Number.isInteger(schoolId) && schoolId > 0 ? schoolId : null;
};

export const belongsToSchool = (user, schoolId) => {
  const requestedSchoolId = Number(schoolId);
  return getSchoolId(user) === requestedSchoolId;
};

export const assertSchoolAccess = (user, schoolId) => {
  if (!isAuthenticated(user)) throw new ForbiddenError("Authentication required");
  if (normalizeRole(user.role) === "super_admin") {
    if (!Number.isInteger(Number(schoolId)) || Number(schoolId) <= 0) {
      throw new ForbiddenError("A valid school context is required");
    }
    return Number(schoolId);
  }
  if (!belongsToSchool(user, schoolId)) {
    throw new ForbiddenError("Access denied for this school");
  }
  return Number(schoolId);
};

export const canAccessStudent = async (user, studentId, options = {}) => {
  const schoolId = assertSchoolAccess(user, options.schoolId ?? getSchoolId(user));
  const student = await prisma.student.findFirst({
    where: { id: String(studentId || "").trim(), schoolId },
    select: { id: true, schoolId: true, className: true, parentId: true, userId: true },
  });
  if (!student) return null;

  const role = normalizeRole(user.role);
  if (role === "parent" || role === "guardian") {
    const linked = await prisma.student.findFirst({
      where: {
        id: student.id,
        schoolId,
        OR: [
          { parentId: user.id },
          { parents: { some: { parent: { userId: user.id, schoolId } } } },
          { guardians: { some: { guardian: { userId: user.id, schoolId } } } },
        ],
      },
      select: { id: true },
    });
    return linked ? student : null;
  }
  if (role === "student") return student.userId === user.id ? student : null;
  return student;
};

export const assertStudentAccess = async (user, studentId, options = {}) => {
  const student = await canAccessStudent(user, studentId, options);
  if (!student) throw new ForbiddenError("You are not authorized to access this student's records");
  return student;
};

export const hasPermission = async (user, permissionCode) => {
  if (!isAuthenticated(user)) return false;
  if (normalizeRole(user.role) === "super_admin") return true;
  const code = String(permissionCode || "").trim();
  if (!code || !user.roleId) return false;
  const permission = await prisma.permission.findFirst({
    where: {
      code,
      OR: [{ schoolId: getSchoolId(user) }, { schoolId: null }],
      rolePermissions: { some: { roleId: user.roleId } },
    },
    select: { id: true },
  });
  return Boolean(permission);
};

export const canAccessFinancialData = (user) =>
  ["principal", "super_admin", "parent"].includes(normalizeRole(user?.role));
