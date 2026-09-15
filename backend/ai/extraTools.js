import { prisma } from "../config/db.js";
import { assertSchoolAccess, getSchoolId } from "../utils/authorization.js";
import { normalizeRole } from "../utils/roleUtils.js";

const role = (user) => normalizeRole(user?.role);
const canUseActivity = (user) => ["super_admin", "principal", "teacher"].includes(role(user));
const canNavigate = (user) => Boolean(user?.id);

const activityTool = {
  name: "getRecentActivity",
  description: "Retrieve recent authorized Petra activity for the current school. Use for questions about what happened today, recent activity, or recent user actions.",
  parameters: {
    type: "object",
    properties: {
      limit: { type: "integer", description: "Number of records, maximum 50" },
      startDate: { type: "string", description: "Optional YYYY-MM-DD start date" },
      endDate: { type: "string", description: "Optional YYYY-MM-DD end date" },
    },
  },
};

const navigateTool = {
  name: "openPetraPage",
  description: "Navigate the authenticated user to an existing Petra page. This does not modify data.",
  parameters: {
    type: "object",
    required: ["page"],
    properties: {
      page: {
        type: "string",
        enum: ["dashboard", "students", "applicants", "attendance", "results", "payments", "fees", "announcements", "messages", "support", "notifications", "settings"],
      },
    },
  },
};

export const getExtraApprovedTools = (user) => {
  const tools = [];
  if (canUseActivity(user)) tools.push(activityTool);
  if (canNavigate(user)) tools.push(navigateTool);
  return tools;
};

export const executeExtraAITool = async ({ user, toolName, input = {} }) => {
  if (toolName === "openPetraPage") {
    if (!canNavigate(user)) throw Object.assign(new Error("You are not authorized to navigate Petra"), { statusCode: 403 });
    const page = String(input.page || "").trim().toLowerCase();
    const routes = {
      dashboard: "/dashboard",
      students: "/students",
      applicants: "/applicants",
      attendance: "/attendance",
      results: "/results",
      payments: "/Payment",
      fees: "/extra-fees",
      announcements: "/announcements",
      messages: "/messages",
      support: "/support",
      notifications: "/notifications",
      settings: "/settings",
    };
    if (!routes[page]) throw Object.assign(new Error("That Petra page is not available to Nuvora"), { statusCode: 400 });
    return { type: "navigation", page, route: routes[page] };
  }

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
      metadata: log.metadata || null,
    })),
  };
};
