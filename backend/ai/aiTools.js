import { assertAIToolPermission } from "./aiPermissions.js";
import { buildAIContext, validateToolInput } from "./aiContext.js";
import { aiDataService } from "../services/aiDataService.js";

const tools = {
  "school.overview": aiDataService.getSchoolOverview,
  "attendance.summary": aiDataService.getAttendanceSummary,
  "student.attendance": aiDataService.getAttendanceSummary,
  "student.results": aiDataService.getStudentResults,
  "fees.outstanding": aiDataService.getOutstandingFees,
};

export const listAITools = () => Object.keys(tools);

export const executeAITool = async ({ user, toolName, input = {} }) => {
  const validatedInput = validateToolInput(toolName, input);
  await assertAIToolPermission(user, toolName);
  const context = buildAIContext(user, validatedInput);
  return tools[toolName]({ ...context, ...validatedInput });
};
