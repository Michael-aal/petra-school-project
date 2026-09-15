import { prisma } from "../config/db.js";

const normalizeSchoolId = (user) => {
  if (!user || user.schoolId === undefined || user.schoolId === null) {
    const err = new Error("School context missing");
    err.statusCode = 403;
    throw err;
  }
  return Number(user.schoolId);
};

const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const normalizeRole = (role) => String(role || "").trim().toLowerCase();

const canMessage = (senderRole, recipientRole) => {
  const sender = normalizeRole(senderRole);
  const recipient = normalizeRole(recipientRole);

  if (["principal", "admin", "super_admin", "superadmin"].includes(sender)) return true;
  if (["principal", "admin", "super_admin", "superadmin"].includes(recipient)) return ["parent", "teacher", "staff"].includes(sender);
  if (["teacher", "staff"].includes(sender)) return recipient === "parent";
  if (sender === "parent") return ["teacher", "staff", "principal", "admin"].includes(recipient);
  return false;
};

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  profileImage: true,
};

export const messageService = {
  listContacts: async (user, query = {}) => {
    const schoolId = normalizeSchoolId(user);
    const senderRole = normalizeRole(user.role);
    const search = query.search ? String(query.search).trim() : "";
    const limit = Math.max(1, Math.min(100, toNumber(query.limit, 50)));

    const allSchoolRoles = ["principal", "admin", "super_admin", "superadmin", "teacher", "staff", "parent"];
    const recipientRoles = ["principal", "admin", "super_admin", "superadmin", "teacher", "staff", "parent"].filter((role) =>
      canMessage(senderRole, role),
    );

    const where = {
      schoolId,
      id: { not: user.id },
      role: { in: recipientRoles.length ? recipientRoles : allSchoolRoles },
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const contacts = await prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: [{ fullName: "asc" }, { email: "asc" }],
      take: limit,
    });

    return { contacts };
  },

  listMessages: async (user, query = {}) => {
    const schoolId = normalizeSchoolId(user);
    const page = Math.max(1, toNumber(query.page, 1));
    const limit = Math.max(1, Math.min(50, toNumber(query.limit, 20)));
    const folder = query.folder === "sent" ? "sent" : "inbox";
    const search = query.search ? String(query.search).trim() : "";

    const where = {
      schoolId,
      ...(folder === "sent" ? { senderId: user.id } : { recipientId: user.id }),
    };

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, messages] = await Promise.all([
      prisma.message.count({ where }),
      prisma.message.findMany({
        where,
        orderBy: { sentAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          sender: { select: userSelect },
          recipient: { select: userSelect },
        },
      }),
    ]);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      folder,
    };
  },

  sendMessage: async (user, payload) => {
    const schoolId = normalizeSchoolId(user);
    if (!payload.recipientId) {
      const err = new Error("Recipient is required");
      err.statusCode = 400;
      throw err;
    }
    if (!payload.body) {
      const err = new Error("Message body is required");
      err.statusCode = 400;
      throw err;
    }

    const recipient = await prisma.user.findUnique({
      where: { id: payload.recipientId },
      select: { id: true, schoolId: true, role: true },
    });
    if (!recipient || Number(recipient.schoolId) !== schoolId) {
      const err = new Error("Recipient not found in your school");
      err.statusCode = 404;
      throw err;
    }

    if (!canMessage(user.role, recipient.role)) {
      const err = new Error("You are not allowed to message this role");
      err.statusCode = 403;
      throw err;
    }

    const message = await prisma.message.create({
      data: {
        schoolId,
        senderId: user.id,
        recipientId: recipient.id,
        subject: payload.subject ? String(payload.subject).trim() : "",
        body: String(payload.body).trim(),
      },
    });

    await prisma.notification.create({
      data: {
        schoolId,
        userId: recipient.id,
        title: "New message",
        body: payload.subject ? String(payload.subject).trim() : "You received a new message.",
      },
    });

    return message;
  },

  getConversation: async (user, otherUserId) => {
    const schoolId = normalizeSchoolId(user);
    if (!otherUserId) {
      const err = new Error("Conversation user ID is required");
      err.statusCode = 400;
      throw err;
    }

    const otherUser = await prisma.user.findFirst({
      where: { id: otherUserId, schoolId },
      select: { id: true, role: true },
    });
    if (!otherUser || !canMessage(user.role, otherUser.role) && !canMessage(otherUser.role, user.role)) {
      const err = new Error("Conversation not accessible");
      err.statusCode = 403;
      throw err;
    }

    return prisma.message.findMany({
      where: {
        schoolId,
        OR: [
          { senderId: user.id, recipientId: otherUserId },
          { senderId: otherUserId, recipientId: user.id },
        ],
      },
      orderBy: { sentAt: "desc" },
      include: {
        sender: { select: userSelect },
        recipient: { select: userSelect },
      },
    });
  },
};

export default messageService;
