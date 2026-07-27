import crypto from "crypto";
import { prisma } from "../config/db.js";

const getSchoolId = (user) => Number(user?.schoolId || 1);
const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const normalizeStatus = (value = "") => {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "paid") return "Paid";
  if (normalized === "partially paid") return "Partially Paid";
  if (normalized === "pending") return "Pending";
  if (normalized === "failed") return "Failed";
  if (normalized === "refunded") return "Refunded";
  return value || "Pending";
};

const normalizeMethod = (value = "") => {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "cash") return "Cash";
  if (normalized === "bank transfer") return "Bank Transfer";
  if (normalized === "pos") return "POS";
  if (normalized === "paystack") return "Paystack";
  if (normalized === "wallet") return "Wallet";
  return value || "Cash";
};

const makeReceiptNumber = () => `RCP-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
const makeInvoiceNumber = () => `INV-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

const paymentInclude = {
  student: true,
  invoice: { include: { items: true } },
  receipt: true,
};

const mapPayment = (payment) => ({
  ...payment,
  status: normalizeStatus(payment.status),
});

export const financeService = {
  listPayments: async (user, query = {}) => {
    const schoolId = getSchoolId(user);
    const currentPage = Math.max(1, toNumber(query.page, 1));
    const pageSize = Math.max(1, Math.min(100, toNumber(query.limit, 25)));
    const where = { schoolId };

    if (query.search) {
      const search = String(query.search).trim();
      where.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { note: { contains: search, mode: "insensitive" } },
        { student: { name: { contains: search, mode: "insensitive" } } },
        { student: { admissionNumber: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (query.studentId) where.studentId = query.studentId;
    if (query.className) where.student = { className: { contains: String(query.className).trim(), mode: "insensitive" } };
    if (query.method) where.method = normalizeMethod(query.method);
    if (query.status) where.status = normalizeStatus(query.status);
    if (query.date) {
      const date = new Date(query.date);
      where.paidAt = { gte: new Date(date.setHours(0, 0, 0, 0)), lt: new Date(date.setHours(23, 59, 59, 999)) };
    }
    if (query.startDate || query.endDate) {
      where.paidAt = {
        ...(query.startDate ? { gte: new Date(new Date(query.startDate).setHours(0, 0, 0, 0)) } : {}),
        ...(query.endDate ? { lte: new Date(new Date(query.endDate).setHours(23, 59, 59, 999)) } : {}),
      };
    }

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        include: paymentInclude,
      }),
    ]);

    return {
      payments: payments.map(mapPayment),
      pagination: {
        page: currentPage,
        limit: pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  },

  getPaymentById: async (user, id) => {
    const payment = await prisma.payment.findFirst({ where: { id, schoolId: getSchoolId(user) }, include: paymentInclude });
    if (!payment) {
      const error = new Error("Payment not found");
      error.statusCode = 404;
      throw error;
    }
    return mapPayment(payment);
  },

  createPayment: async (user, payload) => {
    const amount = Number(payload.amount);
    if (!amount || amount <= 0) {
      const error = new Error("Amount must be a positive number");
      error.statusCode = 400;
      throw error;
    }
    const invoice = payload.invoiceId
      ? await prisma.invoice.findFirst({ where: { id: payload.invoiceId, schoolId: getSchoolId(user) } })
      : null;
    const payment = await prisma.payment.create({
      data: {
        schoolId: getSchoolId(user),
        studentId: payload.studentId,
        invoiceId: invoice?.id || null,
        method: normalizeMethod(payload.method),
        status: normalizeStatus(payload.status),
        amount,
        paidAt: payload.paidAt ? new Date(payload.paidAt) : new Date(),
        reference: payload.reference || `PAY-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
        note: payload.note || null,
        createdById: user.id,
      },
      include: paymentInclude,
    });

    const receipt = await prisma.receipt.create({
      data: {
        schoolId: getSchoolId(user),
        paymentId: payment.id,
        receiptNumber: makeReceiptNumber(),
      },
    });

    return mapPayment({ ...payment, receipt });
  },

  updatePayment: async (user, id, payload) => {
    const existing = await prisma.payment.findFirst({ where: { id, schoolId: getSchoolId(user) } });
    if (!existing) {
      const error = new Error("Payment not found");
      error.statusCode = 404;
      throw error;
    }
    const updated = await prisma.payment.update({
      where: { id },
      data: {
        studentId: payload.studentId,
        invoiceId: payload.invoiceId || null,
        method: payload.method ? normalizeMethod(payload.method) : undefined,
        status: payload.status ? normalizeStatus(payload.status) : undefined,
        amount: payload.amount !== undefined ? Number(payload.amount) : undefined,
        paidAt: payload.paidAt ? new Date(payload.paidAt) : undefined,
        note: payload.note,
      },
      include: paymentInclude,
    });
    return mapPayment(updated);
  },

  deletePayment: async (user, id) => {
    const existing = await prisma.payment.findFirst({ where: { id, schoolId: getSchoolId(user) } });
    if (!existing) {
      const error = new Error("Payment not found");
      error.statusCode = 404;
      throw error;
    }
    await prisma.receipt.deleteMany({ where: { paymentId: id } });
    return prisma.payment.delete({ where: { id } });
  },

  listInvoices: async (user) =>
    prisma.invoice.findMany({
      where: { schoolId: getSchoolId(user) },
      orderBy: { createdAt: "desc" },
      include: { items: true, payments: true, student: true },
    }),

  listFeeStructures: async (user) =>
    prisma.feeStructure.findMany({
      where: { schoolId: getSchoolId(user) },
      orderBy: { createdAt: "desc" },
      include: { feeCategory: true },
    }),

  listInstallmentPlans: async (user) =>
    prisma.installmentPlan.findMany({
      where: { schoolId: getSchoolId(user) },
      orderBy: { createdAt: "desc" },
      include: { student: true, payments: true },
    }),

  getCashflow: async (user) => {
    const schoolId = getSchoolId(user);
    const [payments, expenses] = await Promise.all([
      prisma.payment.findMany({ where: { schoolId }, orderBy: { paidAt: "desc" }, take: 20, include: { student: true } }),
      prisma.expense.findMany({ where: { schoolId }, orderBy: { occurredAt: "desc" }, take: 20, include: { category: true } }),
    ]);

    const revenue = await prisma.payment.aggregate({ where: { schoolId, status: "Paid" }, _sum: { amount: true } });
    const expenseTotal = await prisma.expense.aggregate({ where: { schoolId }, _sum: { amount: true } });

    return {
      totalRevenue: revenue._sum.amount || 0,
      totalExpenses: expenseTotal._sum.amount || 0,
      netIncome: (revenue._sum.amount || 0) - (expenseTotal._sum.amount || 0),
      outstandingFees: 0,
      revenueToday: 0,
      revenueThisMonth: 0,
      revenueThisYear: 0,
      expensesByCategory: [],
      monthlyRevenue: [],
      monthlyExpense: [],
      recentTransactions: payments.map((payment) => ({ ...payment, type: "Payment" })),
      recentExpenses: expenses,
    };
  },
};
