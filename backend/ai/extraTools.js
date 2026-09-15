import { prisma } from "../config/db.js";
import { assertSchoolAccess, getSchoolId } from "../utils/authorization.js";
import { normalizeRole } from "../utils/roleUtils.js";

const activityTool = {
  name: "getRecentActivity",
  description: "Retrieve recent authorized Petra activity for the current school. Use for questions like what happened today, recent activity, or recent user actions.",
  parameters: {
    type: "object",
    properties: {
      limit: { type: "integer", description: "Number of records, maximum 50" },
      startDate: { type: "string", description: "Optional YYYY-MM-DD start date" },
      endDate: { type: "string", description: "Optional YYYY-MM-DD end date" },
    },
  },
};

const canUseActivity = (user) => ["super_admin", "principal", "teacher"].includes(normalizeRole(user?.role));

export const getExtraApprovedTools = (user) => (canUseActivity(user) ? [activityTool] : []);

export const executeExtraAITool = async ({ user, toolName, input = {} }) => {
  if (toolName !== "getRecentActivity") {
    throw Object.assign(new Error(`AI extra tool "${toolName}" is not registered`), { statusCode: 400 });
  }
  if (!canUseActivity(user)) {
    throw Object.assign(new Error("You are not authorized to view recent school activity"), { statusCode: 403 });
  }

  const schoolId = assertSchoolAccess(user, input.schoolId ?? getSchoolId(user));
  const take = Math.max(1, Math.min(50, Number(input.limit) || 25));
  const createdAt = {};
  if (input.startDate) createdAt.gte = new Date(`${input.startDate}T00:00:00.000Z`);
  if (input.endDate) createdAt.lte = new Date(`${input.endDate}T23:59:59.999Z`);

  const logs = await prisma.activityLog.findMany({
    where: { schoolId, ...(Object.keys(createdAt).length ? { createdAt } : {}) },
    orderBy: { createdAt: "desc" },
    take,
    include: { user: { select: { id: true, fullName: true, role: true } } },
  });

  return {
    schoolId,
    count: logs.length,
    activity: logs.map((log) => ({
      id: log.id,
      at: log.createdAt,
      user: log.user ? { id: log.user.id, name: log.user.fullName, role: log.user.role } : null,
      action: log.activity,
      entity: log.entity || "Activity",
      details: log.details || "",
    })),
  };
};
