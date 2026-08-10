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

export const messageService = {
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
          sender: { select: { id: true, fullName: true, email: true, role: true, profileImage: true } },
          recipient: { select: { id: true, fullName: true, email: true, role: true, profileImage: true } },
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

    const recipient = await prisma.user.findUnique({ where: { id: payload.recipientId } });
    if (!recipient || Number(recipient.schoolId) !== schoolId) {
      const err = new Error("Recipient not found in your school");
      err.statusCode = 404;
      throw err;
    }

    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        recipientId: recipient.id,
        subject: payload.subject ? String(payload.subject).trim() : "",
        body: String(payload.body).trim(),
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

    const conversation = await prisma.message.findMany({
      where: {
        schoolId,
        OR: [
          { senderId: user.id, recipientId: otherUserId },
          { senderId: otherUserId, recipientId: user.id },
        ],
      },
      orderBy: { sentAt: "desc" },
      include: {
        sender: { select: { id: true, fullName: true, email: true, role: true, profileImage: true } },
        recipient: { select: { id: true, fullName: true, email: true, role: true, profileImage: true } },
      },
    });

    return conversation;
  },
};

export default messageService;
