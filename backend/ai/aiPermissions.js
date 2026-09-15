import { normalizeRole } from "../utils/roleUtils.js";
import { hasPermission } from "../utils/authorization.js";

export const normalizeToolName = (toolName = "") => {
  const normalized = String(toolName || "").trim();
  const aliasMap = {
    "school.overview": "getSchoolOverview",
    "getSchoolOverview": "getSchoolOverview",
    "attendance.summary": "getAttendanceSummary",
    "getAttendanceSummary": "getAttendanceSummary",
    "student.attendance": "getStudentAttendance",
    "getStudentAttendance": "getStudentAttendance",
    "student.results": "getStudentResults",
    "getStudentResults": "getStudentResults",
    "fees.outstanding": "getFeeSummary",
    "finance.summary": "getFeeSummary",
    "getFeeSummary": "getFeeSummary",
  };
  return aliasMap[normalized] || normalized;
};

const SCHOOL_ADMIN_TOOLS = [
  "getSchoolOverview",
  "getAttendanceSummary",
  "getStudentAttendance",
  "getStudentResults",
  "getFeeSummary",
  "school.overview",
  "attendance.summary",
  "student.attendance",
  "student.results",
  "fees.outstanding",
  "finance.summary",
  "admissions.pending",
];

const roleToolDefaults = {
  super_admin: new Set(SCHOOL_ADMIN_TOOLS),
  superadmin: new Set(SCHOOL_ADMIN_TOOLS),
  principal: new Set(SCHOOL_ADMIN_TOOLS),
  teacher: new Set([
    "getAttendanceSummary",
    "getStudentAttendance",
    "getStudentResults",
    "attendance.summary",
    "student.attendance",
    "student.results",
  ]),
  parent: new Set([
    "getStudentAttendance",
    "getStudentResults",
    "getFeeSummary",
    "student.attendance",
    "student.results",
    "fees.outstanding",
  ]),
  guardian: new Set([
    "getStudentAttendance",
    "getStudentResults",
    "getFeeSummary",
    "student.attendance",
    "student.results",
    "fees.outstanding",
  ]),
  student: new Set([
    "getStudentAttendance",
    "getStudentResults",
    "getFeeSummary",
    "student.attendance",
    "student.results",
    "fees.outstanding",
  ]),
};

export const canUseAITool = async (user, toolName) => {
  const userRole = normalizeRole(user?.role);
  const allowedTools = roleToolDefaults[userRole];
  if (!allowedTools) return false;

  const canonicalName = normalizeToolName(toolName);
  if (!allowedTools.has(toolName) && !allowedTools.has(canonicalName)) return false;

  // Parents/guardians/students must never inherit school-wide attendance/finance aliases.
  if (["parent", "guardian", "student"].includes(userRole) && ["finance.summary", "attendance.summary"].includes(toolName)) {
    return false;
  }

  const explicitPermission = `ai.${canonicalName}`;
  const hasStoredPermissions = Boolean(user?.roleId);
  return !hasStoredPermissions || (await hasPermission(user, explicitPermission));
};

export const assertAIToolPermission = async (user, toolName) => {
  if (!(await canUseAITool(user, toolName))) {
    throw Object.assign(new Error("You are not authorized to use this AI data tool"), { statusCode: 403 });
  }
};
