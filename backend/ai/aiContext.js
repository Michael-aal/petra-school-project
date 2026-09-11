import { z } from "zod";
import { getSchoolId, isAuthenticated } from "../utils/authorization.js";
import { normalizeToolName } from "./aiPermissions.js";
import { prisma } from "../config/db.js";
import { normalizeRole } from "../utils/roleUtils.js";
import { parentAccessService } from "../services/parentAccessService.js";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD").optional();

export const toolSchemas = {
  getSchoolOverview: z.object({
    schoolId: z.coerce.number().int().positive().optional(),
  }),
  getAttendanceSummary: z.object({
    schoolId: z.coerce.number().int().positive().optional(),
    studentId: z.string().trim().min(1).optional(),
    className: z.string().trim().min(1).optional(),
    startDate: date,
    endDate: date,
    term: z.string().trim().optional(),
  }),
  getStudentAttendance: z.object({
    schoolId: z.coerce.number().int().positive().optional(),
    studentId: z.string().trim().min(1).optional(),
    startDate: date,
    endDate: date,
  }),
  getStudentResults: z.object({
    schoolId: z.coerce.number().int().positive().optional(),
    studentId: z.string().trim().min(1).optional(),
    termId: z.string().trim().optional(),
    academicYearId: z.string().trim().optional(),
  }),
  getFeeSummary: z.object({
    schoolId: z.coerce.number().int().positive().optional(),
    studentId: z.string().trim().min(1).optional(),
  }),
};

// Aliases
toolSchemas["school.overview"] = toolSchemas.getSchoolOverview;
toolSchemas["attendance.summary"] = toolSchemas.getAttendanceSummary;
toolSchemas["student.attendance"] = toolSchemas.getStudentAttendance;
toolSchemas["student.results"] = toolSchemas.getStudentResults;
toolSchemas["fees.outstanding"] = toolSchemas.getFeeSummary;
toolSchemas["finance.summary"] = toolSchemas.getFeeSummary;

export const buildAIContext = async (user, request = {}) => {
  if (!isAuthenticated(user)) {
    throw Object.assign(new Error("Authentication required"), { statusCode: 401 });
  }

  const schoolId = request.schoolId ?? getSchoolId(user);
  const role = normalizeRole(user.role);

  const context = {
    user,
    schoolId,
    role,
    userId: user.id,
    userName: user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username,
  };

  if (role === "parent" || role === "guardian") {
    const children = await parentAccessService.listChildren(user.id, schoolId).catch(() => []);
    context.linkedChildren = children.map((c) => ({
      id: c.id,
      name: c.name,
      className: c.className,
      admissionNumber: c.admissionNumber,
    }));
    // If request contains a preferred studentId or parent has exactly 1 child, set default
    if (request.selectedStudentId && context.linkedChildren.some((c) => c.id === request.selectedStudentId)) {
      context.defaultStudentId = request.selectedStudentId;
    } else if (context.linkedChildren.length === 1) {
      context.defaultStudentId = context.linkedChildren[0].id;
    }
  } else if (role === "student") {
    // Resolve student record for authenticated student
    const studentRecord = await prisma.student.findFirst({
      where: {
        OR: [{ userId: user.id }, { id: user.linkedStudentId || undefined }],
        ...(schoolId ? { schoolId } : {}),
      },
      select: { id: true, name: true, className: true },
    }).catch(() => null);

    if (studentRecord) {
      context.studentId = studentRecord.id;
      context.studentName = studentRecord.name;
      context.className = studentRecord.className;
      context.defaultStudentId = studentRecord.id;
    }
  } else if (role === "teacher") {
    const teacherProfile = await prisma.teacher.findFirst({
      where: { userId: user.id, ...(schoolId ? { schoolId } : {}) },
      include: {
        classes: { include: { class: { select: { name: true } } } },
        subjects: { include: { subject: { select: { name: true } } } },
      },
    }).catch(() => null);

    const classNames = teacherProfile?.classes?.map((c) => c.class?.name).filter(Boolean) || [];
    if (!classNames.length && user.staffClassAssigned) {
      classNames.push(...user.staffClassAssigned.split(",").map((s) => s.trim()).filter(Boolean));
    }
    context.assignedClasses = classNames;
  }

  return context;
};

export const validateToolInput = (toolName, input = {}) => {
  const canonicalName = normalizeToolName(toolName);
  const schema = toolSchemas[canonicalName] || toolSchemas[toolName];
  if (!schema) {
    throw Object.assign(new Error(`Unknown AI data tool: ${toolName}`), { statusCode: 400 });
  }
  const result = schema.safeParse(input);
  if (!result.success) {
    throw Object.assign(new Error("Invalid AI tool parameters"), {
      statusCode: 400,
      details: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }
  return result.data;
};
