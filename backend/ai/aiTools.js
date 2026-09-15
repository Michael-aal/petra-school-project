import { assertAIToolPermission, normalizeToolName } from "./aiPermissions.js";
import { buildAIContext, validateToolInput } from "./aiContext.js";
import { aiDataService } from "../services/aiDataService.js";
import { getLatestStudentResults } from "./latestResultsService.js";
import { getUserDirectory } from "../services/aiUserDirectoryService.js";
import { normalizeRole } from "../utils/roleUtils.js";

const SCHOOL_ADMIN_ROLES = ["super_admin", "superadmin", "principal"];

const toolRegistry = {
  getSchoolOverview: { name: "getSchoolOverview", description: "Get a high-level statistical overview of the authenticated user's school.", parameters: { type: "object", properties: {} }, handler: aiDataService.getSchoolOverview },
  getAttendanceSummary: { name: "getAttendanceSummary", description: "Retrieve attendance statistics for the school, a class, or linked children.", parameters: { type: "object", properties: { className: { type: "string", description: "Optional class name" }, studentId: { type: "string", description: "Optional student ID" }, startDate: { type: "string", description: "Start date in YYYY-MM-DD format" }, endDate: { type: "string", description: "End date in YYYY-MM-DD format" } } }, handler: aiDataService.getAttendanceSummary },
  getStudentAttendance: { name: "getStudentAttendance", description: "Retrieve date-by-date attendance records and statistics for an authorized student.", parameters: { type: "object", properties: { studentId: { type: "string", description: "Optional student ID" }, startDate: { type: "string", description: "Start date in YYYY-MM-DD format" }, endDate: { type: "string", description: "End date in YYYY-MM-DD format" } } }, handler: aiDataService.getStudentAttendance },
  getStudentResults: { name: "getStudentResults", description: "Retrieve the latest published academic and exam results for an authorized student.", parameters: { type: "object", properties: { studentId: { type: "string", description: "Optional student ID" }, limit: { type: "integer", description: "Maximum latest results, from 1 to 25" } } }, handler: getLatestStudentResults },
  getFeeSummary: { name: "getFeeSummary", description: "Retrieve authoritative school-wide or student fee summary. Teachers are excluded.", parameters: { type: "object", properties: { studentId: { type: "string", description: "Optional student ID" } } }, handler: aiDataService.getFeeSummary },
  getUserDirectory: {
    name: "getUserDirectory",
    description: "Find authenticated-school users using only non-sensitive public profile information such as name, username, role, and account status.",
    parameters: { type: "object", properties: { search: { type: "string", description: "Optional name or username search" }, role: { type: "string", description: "Optional user role filter" }, limit: { type: "integer", description: "Maximum results, from 1 to 100" } } },
    handler: getUserDirectory,
  },
};

toolRegistry["school.overview"] = toolRegistry.getSchoolOverview;
toolRegistry["attendance.summary"] = toolRegistry.getAttendanceSummary;
toolRegistry["student.attendance"] = toolRegistry.getStudentAttendance;
toolRegistry["student.results"] = toolRegistry.getStudentResults;
toolRegistry["fees.outstanding"] = toolRegistry.getFeeSummary;
toolRegistry["finance.summary"] = toolRegistry.getFeeSummary;

export const getApprovedTools = (user) => {
  const normalizedRole = normalizeRole(user?.role);
  const tools = [toolRegistry.getUserDirectory];

  if (SCHOOL_ADMIN_ROLES.includes(normalizedRole)) {
    tools.push(toolRegistry.getSchoolOverview, toolRegistry.getAttendanceSummary, toolRegistry.getStudentAttendance, toolRegistry.getStudentResults, toolRegistry.getFeeSummary);
  } else if (normalizedRole === "teacher") {
    tools.push(toolRegistry.getAttendanceSummary, toolRegistry.getStudentAttendance, toolRegistry.getStudentResults);
  } else if (["parent", "guardian", "student"].includes(normalizedRole)) {
    tools.push(toolRegistry.getAttendanceSummary, toolRegistry.getStudentAttendance, toolRegistry.getStudentResults, toolRegistry.getFeeSummary);
  }
  return tools;
};

export const listAITools = () => Object.keys(toolRegistry);

export const executeAITool = async ({ user, toolName, input = {} }) => {
  const canonicalName = normalizeToolName(toolName);
  const toolEntry = toolRegistry[canonicalName] || toolRegistry[toolName];
  if (!toolEntry) throw Object.assign(new Error(`AI tool \"${toolName}\" is not registered or approved`), { statusCode: 400 });

  const validatedInput = validateToolInput(canonicalName, input);
  await assertAIToolPermission(user, canonicalName);
  const context = await buildAIContext(user, validatedInput);
  return toolEntry.handler({ ...context, ...validatedInput });
};
