import { normalizeRole } from "../utils/roleUtils.js";
import { hasPermission } from "../utils/authorization.js";

// Canonical mapping of tool aliases to primary tool names
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

const roleToolDefaults = {
  super_admin: new Set([
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
  ]),
  principal: new Set([
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
  ]),
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
  const role = normalizeRole(user?.role);

  // Check specific tool name first against role permissions
  if (!roleToolDefaults[role]?.has(toolName)) {
    // If not directly present, also check canonical name only if specific name wasn't explicitly configured differently
    const canonicalName = normalizeToolName(toolName);
    // Explicit exclusions for narrow role scopes:
    if (["parent", "guardian", "student"].includes(role) && (toolName === "finance.summary" || toolName === "attendance.summary")) {
      return false;
    }
    if (!roleToolDefaults[role]?.has(canonicalName)) {
      return false;
    }
  }

  const explicitPermission = `ai.${toolName}`;
  const hasStoredPermissions = Boolean(user?.roleId);
  return !hasStoredPermissions || (await hasPermission(user, explicitPermission));
};

export const assertAIToolPermission = async (user, toolName) => {
  if (!(await canUseAITool(user, toolName))) {
    throw Object.assign(new Error("You are not authorized to use this AI data tool"), { statusCode: 403 });
  }
};
