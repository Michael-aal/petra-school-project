import crypto from "crypto";
import { prisma } from "../config/db.js";
import { paystackService } from "./paystackService.js";
import { parentAccessService } from "./parentAccessService.js";

const getSchoolId = (user) => {
  if (!user || user?.schoolId === undefined || user?.schoolId === null) {
    const err = new Error("School context missing");
    err.statusCode = 403;
    throw err;
  }
  return Number(user.schoolId);
};
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

const safeDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date = new Date()) => new Date(date.setHours(0, 0, 0, 0));
const endOfDay = (date = new Date()) => new Date(date.setHours(23, 59, 59, 999));
const startOfMonth = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), 1);

const notifyUser = async ({ schoolId, userId, title, body }) => {
  if (!userId) return;
  await prisma.notification.create({ data: { schoolId, userId, title, body } });
};

const notifyAdmin = async ({ schoolId, title, body }) => {
  await prisma.notification.create({ data: { schoolId, title, body } });
};

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(amount || 0);

const calculateTotals = async (schoolId) => {
  const [successful, pending, failed, refunded, outstanding] = await Promise.all([
    prisma.payment.aggregate({ where: { schoolId, status: "Successful" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { schoolId, status: "Pending" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { schoolId, status: "Failed" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { schoolId, status: "Refunded" }, _sum: { amount: true } }),
    prisma.invoice.aggregate({ where: { schoolId, outstandingBalance: { gt: 0 } }, _sum: { outstandingBalance: true } }),
  ]);

  const [today, month] = await Promise.all([
    prisma.payment.aggregate({
      where: { schoolId, status: "Successful", paidAt: { gte: startOfDay() } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { schoolId, status: "Successful", paidAt: { gte: startOfMonth() } },
      _sum: { amount: true },
    }),
  ]);

  return {
    availableBalance: successful._sum.amount || 0,
    pendingBalance: pending._sum.amount || 0,
    refundedAmount: refunded._sum.amount || 0,
    failedAmount: failed._sum.amount || 0,
    totalRevenue: successful._sum.amount || 0,
    todaysRevenue: today._sum.amount || 0,
    monthlyRevenue: month._sum.amount || 0,
    successfulPayments: await prisma.payment.count({ where: { schoolId, status: "Successful" } }),
    failedPayments: await prisma.payment.count({ where: { schoolId, status: "Failed" } }),
    refundedPayments: await prisma.payment.count({ where: { schoolId, status: "Refunded" } }),
    outstandingFees: outstanding._sum.outstandingBalance || 0,
  };
};

const mapPayment = (payment) => ({
  ...payment,
  status: normalizeStatus(payment.status),
  receiptNumber: payment.receipt?.receiptNumber || null,
});

export const financeService = {
  listFeeStructures: async (user, query = {}) =>
    prisma.feeStructure.findMany({
      where: {
        schoolId: getSchoolId(user),
        ...(query.className ? { className: String(query.className).trim() } : {}),
        ...(query.level ? { className: { contains: String(query.level).trim(), mode: "insensitive" } } : {}),
        ...(query.isActive !== undefined ? { isActive: String(query.isActive) === "true" } : {}),
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      include: { feeCategory: true, studentFees: { include: { student: { include: { user: { select: { id: true, fullName: true } } } } } } },
    }),

  createFeeStructure: async (user, payload) => {
    const schoolId = getSchoolId(user);
    const amount = Number(payload.amount);
    if (!payload.name && !payload.feeCategoryId) {
      const error = new Error("Fee name or category is required");
      error.statusCode = 400;
      throw error;
    }
    if (!amount || amount <= 0) {
      const error = new Error("Amount must be a positive number");
      error.statusCode = 400;
      throw error;
    }
    return prisma.feeStructure.create({
      data: {
        schoolId,
        feeCategoryId: payload.feeCategoryId || null,
        className: payload.className || null,
        session: payload.session || null,
        term: payload.term || null,
        amount,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
        isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
      },
      include: { feeCategory: true },
    });
  },

  updateFeeStructure: async (user, id, payload) => {
    const schoolId = getSchoolId(user);
    const existing = await prisma.feeStructure.findFirst({ where: { id, schoolId } });
    if (!existing) {
      const error = new Error("Fee structure not found");
      error.statusCode = 404;
      throw error;
    }
    return prisma.feeStructure.update({
      where: { id },
      data: {
        feeCategoryId: payload.feeCategoryId !== undefined ? payload.feeCategoryId || null : undefined,
        className: payload.className !== undefined ? payload.className || null : undefined,
        session: payload.session !== undefined ? payload.session || null : undefined,
        term: payload.term !== undefined ? payload.term || null : undefined,
        amount: payload.amount !== undefined ? Number(payload.amount) : undefined,
        dueDate: payload.dueDate !== undefined ? (payload.dueDate ? new Date(payload.dueDate) : null) : undefined,
        isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : undefined,
      },
      include: { feeCategory: true },
    });
  },

  deleteFeeStructure: async (user, id) => {
    const schoolId = getSchoolId(user);
    const existing = await prisma.feeStructure.findFirst({ where: { id, schoolId } });
    if (!existing) {
      const error = new Error("Fee structure not found");
      error.statusCode = 404;
      throw error;
    }
    return prisma.feeStructure.delete({ where: { id } });
  },

  assignFeeStructure: async (user, payload) => {
    const schoolId = getSchoolId(user);
    const structure = await prisma.feeStructure.findFirst({ where: { id: payload.feeStructureId, schoolId } });
    if (!structure) {
      const error = new Error("Fee structure not found");
      error.statusCode = 404;
      throw error;
    }
    const students = await prisma.student.findMany({
      where: {
        schoolId,
        ...(payload.studentId ? { id: payload.studentId } : {}),
        ...(payload.className ? { className: String(payload.className).trim() } : {}),
        ...(payload.level ? { className: { contains: String(payload.level).trim(), mode: "insensitive" } } : {}),
      },
      select: { id: true },
    });
    const created = await prisma.$transaction(async (tx) => {
      const records = [];
      for (const student of students) {
        const existing = await tx.studentFee.findFirst({
          where: { schoolId, studentId: student.id, feeStructureId: structure.id },
        });
        const record = existing
          ? await tx.studentFee.update({
              where: { id: existing.id },
              data: { amount: structure.amount, outstandingBalance: structure.amount },
            })
          : await tx.studentFee.create({
              data: {
                schoolId,
                studentId: student.id,
                feeStructureId: structure.id,
                amount: structure.amount,
                outstandingBalance: structure.amount,
              },
            });
        records.push(record);
      }
      return records;
    });
    return { feeStructure: structure, assignedCount: created.length };
  },

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
      where.paidAt = { gte: startOfDay(date), lte: endOfDay(date) };
    }
    if (query.startDate || query.endDate) {
      where.paidAt = {
        ...(query.startDate ? { gte: startOfDay(safeDate(query.startDate) || new Date()) } : {}),
        ...(query.endDate ? { lte: endOfDay(safeDate(query.endDate) || new Date()) } : {}),
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

  getPaymentReceipt: async (user, paymentId) => {
    const schoolId = getSchoolId(user);
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, schoolId },
      include: { receipt: true, student: true, invoice: { include: { items: true } } },
    });
    if (!payment || !payment.receipt) {
      const error = new Error("Receipt not found");
      error.statusCode = 404;
      throw error;
    }
    return {
      payment: mapPayment(payment),
      receipt: payment.receipt,
      student: payment.student,
      invoice: payment.invoice,
    };
  },

  createPayment: async (user, payload) => {
    const schoolId = getSchoolId(user);
    const student = await prisma.student.findFirst({ where: { id: payload.studentId, schoolId } });
    if (!student) {
      const error = new Error("Student not found");
      error.statusCode = 404;
      throw error;
    }

    const invoiceIds = Array.isArray(payload.invoiceIds)
      ? payload.invoiceIds.filter(Boolean)
      : payload.invoiceId
      ? [payload.invoiceId]
      : [];
    const studentFeeIds = Array.isArray(payload.studentFeeIds)
      ? payload.studentFeeIds.filter(Boolean)
      : payload.studentFeeId
      ? [payload.studentFeeId]
      : [];

    const invoices = invoiceIds.length
      ? await prisma.invoice.findMany({ where: { id: { in: invoiceIds }, schoolId } })
      : [];
    const fees = studentFeeIds.length
      ? await prisma.studentFee.findMany({ where: { id: { in: studentFeeIds }, schoolId } })
      : [];

    const invoiceDue = invoices.reduce((sum, invoice) => sum + Number(invoice.outstandingBalance || invoice.totalAmount || 0), 0);
    const feeDue = fees.reduce((sum, fee) => sum + Number(fee.outstandingBalance || fee.amount || 0), 0);
    const requestedAmount = payload.amount !== undefined && payload.amount !== null ? Number(payload.amount) : invoiceDue + feeDue;
    const amount = Number(requestedAmount);

    if (!amount || amount <= 0) {
      const error = new Error("Amount must be a positive number");
      error.statusCode = 400;
      throw error;
    }

    const payment = await prisma.payment.create({
      data: {
        schoolId,
        studentId: student.id,
        invoiceId: invoices[0]?.id || null,
        method: "Paystack",
        status: "Pending",
        amount,
        paidAt: new Date(),
        reference: payload.reference || `PAY-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
        note: payload.note || null,
        createdById: user.id,
      },
      include: paymentInclude,
    });

    const metadata = {
      studentId: student.id,
      invoiceIds,
      studentFeeIds,
      schoolId,
      totalDue: invoiceDue + feeDue,
    };

    const session = await paystackService.initializePayment({
      amount,
      email: student.parentEmail || user.email,
      userId: user.id,
      reference: payment.reference,
      metadata,
      callbackUrl: payload.callbackUrl,
    });

    await notifyUser({ schoolId, userId: user.id, title: "Payment initialized", body: `Your payment for ${formatMoney(amount)} is pending Paystack checkout.` });
    await notifyAdmin({ schoolId, title: "Payment pending", body: `A payment of ${formatMoney(amount)} is pending verification.` });

    return { payment: mapPayment(payment), session };
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

    const revenue = await prisma.payment.aggregate({ where: { schoolId, status: "Successful" }, _sum: { amount: true } });
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

  getParentFees: async (user, query = {}) => {
    const schoolId = getSchoolId(user);
    const children = await parentAccessService.listChildren(user.id);
    const requestedStudentId = String(query.studentId || "").trim();
    const selectedChild = requestedStudentId ? await parentAccessService.assertStudentAccess(user.id, requestedStudentId) : children[0] || null;
    if (!selectedChild) {
      return { student: null, fees: [], payments: [], summary: await calculateTotals(schoolId) };
    }

    const [fees, invoices, payments, structures] = await Promise.all([
      prisma.studentFee.findMany({ where: { schoolId, studentId: selectedChild.id }, include: { feeStructure: { include: { feeCategory: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.invoice.findMany({ where: { schoolId, studentId: selectedChild.id }, include: { items: true, payments: true }, orderBy: { createdAt: "desc" } }),
      prisma.payment.findMany({ where: { schoolId, studentId: selectedChild.id }, include: paymentInclude, orderBy: { createdAt: "desc" } }),
      prisma.feeStructure.findMany({ where: { schoolId, isActive: true }, include: { feeCategory: true }, orderBy: { createdAt: "desc" } }),
    ]);
    return { student: selectedChild, children, fees, invoices, payments: payments.map(mapPayment), feeStructures: structures, summary: await calculateTotals(schoolId) };
  },

  getAdminWallet: async (user) => {
    const schoolId = getSchoolId(user);
    const [summary, recentPayments, settings, bankDetails, refunds] = await Promise.all([
      calculateTotals(schoolId),
      prisma.payment.findMany({ where: { schoolId }, include: paymentInclude, orderBy: { createdAt: "desc" }, take: 25 }),
      prisma.settings.findMany({ where: { schoolId, key: { in: ["payment_settings", "bank_details"] } } }),
      prisma.settings.findFirst({ where: { schoolId, key: "bank_details" } }),
      prisma.payment.findMany({ where: { schoolId, status: "Refunded" }, include: paymentInclude, orderBy: { createdAt: "desc" }, take: 10 }),
    ]);
    return { summary, recentPayments: recentPayments.map(mapPayment), settings, bankDetails, refunds: refunds.map(mapPayment) };
  },

  processVerifiedPayment: async (reference, verificationData = {}) => {
    const existing = await prisma.payment.findUnique({ where: { reference }, include: paymentInclude });
    if (!existing) {
      throw Object.assign(new Error("Payment record not found"), { statusCode: 404 });
    }
    if (["Successful", "Refunded"].includes(existing.status)) {
      return mapPayment(existing);
    }

    const schoolId = existing.schoolId;
    const paidAt = verificationData.paid_at ? new Date(verificationData.paid_at) : new Date();
    const metadata = verificationData.metadata || {};

    const updated = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { reference },
        data: { status: "Successful", paidAt, method: "Paystack" },
        include: paymentInclude,
      });
      const invoiceIds = Array.isArray(metadata.invoiceIds) ? metadata.invoiceIds : [];
      const studentFeeIds = Array.isArray(metadata.studentFeeIds) ? metadata.studentFeeIds : [];
      let remaining = Number(payment.amount || 0);

      if (invoiceIds.length) {
        const invoices = await tx.invoice.findMany({ where: { id: { in: invoiceIds }, schoolId } });
        for (const invoice of invoices) {
          if (remaining <= 0) break;
          const currentOutstanding = Number(invoice.outstandingBalance || invoice.totalAmount || 0);
          const paymentPortion = Math.min(remaining, currentOutstanding);
          const newOutstanding = Math.max(0, currentOutstanding - paymentPortion);
          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              outstandingBalance: newOutstanding,
              status: newOutstanding <= 0 ? "Paid" : "Partially Paid",
            },
          });
          remaining -= paymentPortion;
        }
      }

      if (studentFeeIds.length && remaining > 0) {
        const fees = await tx.studentFee.findMany({ where: { id: { in: studentFeeIds }, schoolId } });
        for (const fee of fees) {
          if (remaining <= 0) break;
          const currentOutstanding = Number(fee.outstandingBalance || fee.amount || 0);
          const paymentPortion = Math.min(remaining, currentOutstanding);
          const newOutstanding = Math.max(0, currentOutstanding - paymentPortion);
          await tx.studentFee.update({ where: { id: fee.id }, data: { outstandingBalance: newOutstanding, status: newOutstanding <= 0 ? "Paid" : "Partially Paid" } });
          remaining -= paymentPortion;
        }
      }

      if (!invoiceIds.length && !studentFeeIds.length && payment.invoiceId) {
        const invoice = await tx.invoice.findUnique({ where: { id: payment.invoiceId } });
        if (invoice) {
          const currentOutstanding = Number(invoice.outstandingBalance || invoice.totalAmount || 0);
          const newOutstanding = Math.max(0, currentOutstanding - Number(payment.amount || 0));
          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              outstandingBalance: newOutstanding,
              status: newOutstanding <= 0 ? "Paid" : "Partially Paid",
            },
          });
        }
      }

      if (!invoiceIds.length && !studentFeeIds.length) {
        const fees = await tx.studentFee.findMany({ where: { studentId: existing.studentId, schoolId, outstandingBalance: { gt: 0 } }, orderBy: { createdAt: "asc" } });
        for (const fee of fees) {
          if (remaining <= 0) break;
          const currentOutstanding = Number(fee.outstandingBalance || fee.amount || 0);
          const paymentPortion = Math.min(remaining, currentOutstanding);
          const newOutstanding = Math.max(0, currentOutstanding - paymentPortion);
          await tx.studentFee.update({ where: { id: fee.id }, data: { outstandingBalance: newOutstanding, status: newOutstanding <= 0 ? "Paid" : "Partially Paid" } });
          remaining -= paymentPortion;
        }
      }

      const receipt = await tx.receipt.upsert({
        where: { paymentId: payment.id },
        update: {},
        create: { schoolId, paymentId: payment.id, receiptNumber: makeReceiptNumber() },
      });
      return { ...payment, receipt };
    });

    const student = await prisma.student.findUnique({ where: { id: existing.studentId } });
    await notifyUser({ schoolId, userId: student?.parentId || existing.createdById, title: "Payment successful", body: `Payment ${reference} has been verified.` });
    await notifyUser({ schoolId, userId: existing.createdById, title: "Receipt available", body: `Receipt for ${reference} is now available.` });
    await notifyAdmin({ schoolId, title: "Payment received", body: `Payment ${reference} was verified successfully.` });
    return mapPayment(updated);
  },

  processFailedPayment: async (reference, reason) => {
    const existing = await prisma.payment.findUnique({ where: { reference }, include: paymentInclude });
    if (!existing) {
      throw Object.assign(new Error("Payment record not found"), { statusCode: 404 });
    }
    if (existing.status === "Successful") {
      return mapPayment(existing);
    }
    const updated = await prisma.payment.update({
      where: { reference },
      data: { status: "Failed" },
      include: paymentInclude,
    });
    await notifyUser({ schoolId: existing.schoolId, userId: existing.createdById, title: "Payment failed", body: `Payment ${reference} failed: ${reason || "Paystack verification failed"}.` });
    await notifyAdmin({ schoolId: existing.schoolId, title: "Payment failed", body: `Payment ${reference} failed verification.` });
    return mapPayment(updated);
  },

  processPaystackWebhook: async (rawBody, signatureHeader) => {
    const payload = paystackService.parseWebhookPayload(rawBody, signatureHeader);
    const reference = payload?.data?.reference;
    if (!reference) {
      throw Object.assign(new Error("Webhook missing payment reference"), { statusCode: 400 });
    }

    if (payload?.event === "charge.success") {
      const verified = await paystackService.verifyTransaction(reference);
      return financeService.processVerifiedPayment(reference, verified);
    }

    if (payload?.event === "charge.failed") {
      return financeService.processFailedPayment(reference, payload?.data?.gateway_response || payload?.data?.failure_message || "Paystack charge failed");
    }

    return payload;
  },
};
