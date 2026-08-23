import { z } from "zod";
import { getSchoolId, isAuthenticated } from "../utils/authorization.js";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD").optional();

export const toolSchemas = {
  "school.overview": z.object({ schoolId: z.coerce.number().int().positive().optional() }),
  "attendance.summary": z.object({ schoolId: z.coerce.number().int().positive().optional(), studentId: z.string().trim().min(1).optional(), startDate: date, endDate: date }),
  "student.attendance": z.object({ schoolId: z.coerce.number().int().positive().optional(), studentId: z.string().trim().min(1), startDate: date, endDate: date }),
  "student.results": z.object({ schoolId: z.coerce.number().int().positive().optional(), studentId: z.string().trim().min(1) }),
  "fees.outstanding": z.object({ schoolId: z.coerce.number().int().positive().optional(), studentId: z.string().trim().min(1).optional() }),
};

export const buildAIContext = (user, request = {}) => {
  if (!isAuthenticated(user)) throw Object.assign(new Error("Authentication required"), { statusCode: 401 });
  const schoolId = request.schoolId ?? getSchoolId(user);
  return { user, schoolId };
};

export const validateToolInput = (toolName, input = {}) => {
  const schema = toolSchemas[toolName];
  if (!schema) throw Object.assign(new Error("Unknown AI data tool"), { statusCode: 400 });
  const result = schema.safeParse(input);
  if (!result.success) throw Object.assign(new Error("Invalid AI tool parameters"), { statusCode: 400, details: result.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) });
  return result.data;
};
