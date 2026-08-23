import { normalizeRole } from "../utils/roleUtils.js";
import { hasPermission } from "../utils/authorization.js";

const roleToolDefaults = {
  super_admin: new Set(["school.overview", "attendance.summary", "student.attendance", "student.results", "finance.summary", "fees.outstanding", "admissions.pending"]),
  principal: new Set(["school.overview", "attendance.summary", "student.attendance", "student.results", "finance.summary", "fees.outstanding", "admissions.pending"]),
  teacher: new Set(["attendance.summary", "student.attendance", "student.results"]),
  parent: new Set(["student.attendance", "student.results", "fees.outstanding"]),
  guardian: new Set(["student.attendance", "student.results", "fees.outstanding"]),
  student: new Set(["student.attendance", "student.results"]),
};

export const canUseAITool = async (user, toolName) => {
  const role = normalizeRole(user?.role);
  if (!roleToolDefaults[role]?.has(toolName)) return false;
  const explicitPermission = `ai.${toolName}`;
  const hasStoredPermissions = Boolean(user?.roleId);
  return !hasStoredPermissions || (await hasPermission(user, explicitPermission));
};

export const assertAIToolPermission = async (user, toolName) => {
  if (!(await canUseAITool(user, toolName))) {
    throw Object.assign(new Error("You are not authorized to use this AI data tool"), { statusCode: 403 });
  }
};
