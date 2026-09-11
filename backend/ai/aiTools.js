import { assertAIToolPermission, normalizeToolName } from "./aiPermissions.js";
import { buildAIContext, validateToolInput } from "./aiContext.js";
import { aiDataService } from "../services/aiDataService.js";
import { normalizeRole } from "../utils/roleUtils.js";

const toolRegistry = {
  getSchoolOverview: {
    name: "getSchoolOverview",
    description:
      "Get a high-level statistical overview of the authenticated user's school (student count, teacher count, class count, session, and overall attendance rate). Restricted to Principals and Super Admins.",
    parameters: {
      type: "object",
      properties: {},
    },
    handler: aiDataService.getSchoolOverview,
  },
  getAttendanceSummary: {
    name: "getAttendanceSummary",
    description:
      "Retrieve attendance statistics (total marked, present, absent, percentage) for the school, a class, or linked children.",
    parameters: {
      type: "object",
      properties: {
        className: { type: "string", description: "Optional class name to filter by (e.g. 'Grade 10')" },
        studentId: { type: "string", description: "Optional student ID" },
        startDate: { type: "string", description: "Start date in YYYY-MM-DD format" },
        endDate: { type: "string", description: "End date in YYYY-MM-DD format" },
      },
    },
    handler: aiDataService.getAttendanceSummary,
  },
  getStudentAttendance: {
    name: "getStudentAttendance",
    description:
      "Retrieve date-by-date attendance records and statistics for an authorized student.",
    parameters: {
      type: "object",
      properties: {
        studentId: { type: "string", description: "Student ID. Optional for students or parents with a single linked child." },
        startDate: { type: "string", description: "Start date in YYYY-MM-DD format" },
        endDate: { type: "string", description: "End date in YYYY-MM-DD format" },
      },
    },
    handler: aiDataService.getStudentAttendance,
  },
  getStudentResults: {
    name: "getStudentResults",
    description:
      "Retrieve published academic scores, percentages, grades, and overall average for an authorized student.",
    parameters: {
      type: "object",
      properties: {
        studentId: { type: "string", description: "Student ID. Optional for students or parents with a single linked child." },
        termId: { type: "string", description: "Optional term name or ID" },
      },
    },
    handler: aiDataService.getStudentResults,
  },
  getFeeSummary: {
    name: "getFeeSummary",
    description:
      "Retrieve authoritative school-wide or student fee summary (total billed, total paid, and outstanding balance). Strictly restricted from teachers.",
    parameters: {
      type: "object",
      properties: {
        studentId: { type: "string", description: "Optional student ID to check specific student fee balance." },
      },
    },
    handler: aiDataService.getFeeSummary,
  },
};

// Aliases
toolRegistry["school.overview"] = toolRegistry.getSchoolOverview;
toolRegistry["attendance.summary"] = toolRegistry.getAttendanceSummary;
toolRegistry["student.attendance"] = toolRegistry.getStudentAttendance;
toolRegistry["student.results"] = toolRegistry.getStudentResults;
toolRegistry["fees.outstanding"] = toolRegistry.getFeeSummary;
toolRegistry["finance.summary"] = toolRegistry.getFeeSummary;

/**
 * Returns array of tool definitions available to the user based on their role
 */
export const getApprovedTools = (user) => {
  const role = normalizeRole(user?.role);
  const tools = [];

  if (["super_admin", "principal"].includes(role)) {
    tools.push(
      toolRegistry.getSchoolOverview,
      toolRegistry.getAttendanceSummary,
      toolRegistry.getStudentAttendance,
      toolRegistry.getStudentResults,
      toolRegistry.getFeeSummary,
    );
  } else if (role === "teacher") {
    tools.push(
      toolRegistry.getAttendanceSummary,
      toolRegistry.getStudentAttendance,
      toolRegistry.getStudentResults,
    );
  } else if (["parent", "guardian", "student"].includes(role)) {
    tools.push(
      toolRegistry.getAttendanceSummary,
      toolRegistry.getStudentAttendance,
      toolRegistry.getStudentResults,
      toolRegistry.getFeeSummary,
    );
  }

  return tools;
};

export const listAITools = () => Object.keys(toolRegistry);

export const executeAITool = async ({ user, toolName, input = {} }) => {
  const canonicalName = normalizeToolName(toolName);
  const toolEntry = toolRegistry[canonicalName] || toolRegistry[toolName];

  if (!toolEntry) {
    throw Object.assign(new Error(`AI tool "${toolName}" is not registered or approved`), { statusCode: 400 });
  }

  const validatedInput = validateToolInput(canonicalName, input);
  await assertAIToolPermission(user, canonicalName);
  const context = await buildAIContext(user, validatedInput);

  return toolEntry.handler({ ...context, ...validatedInput });
};
