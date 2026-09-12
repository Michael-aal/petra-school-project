import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/db.js";
import { paystackService } from "./paystackService.js";
import { parentAccessService } from "./parentAccessService.js";
import { normalizeRole } from "../utils/roleUtils.js";
import { recordAuditMutation } from "../middleware/audit.js";
import { resolveAcademicContext } from "../utils/academicContext.js";

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
const toDecimal = (value) => value instanceof Prisma.Decimal ? value : new Prisma.Decimal(String(value ?? 0));

const resolveApplicationFeeStructure = async (schoolId) => prisma.feeStructure.findFirst({
  where: {
    schoolId,
    isActive: true,
    feeCategory: {
      name: { equals: "APPLICATION FEE", mode: "insensitive" },
      isActive: true,
    },
  },
  include: { feeCategory: true },
  orderBy: { updatedAt: "desc" },
});

const publicStudentInclude = {
  school: { select: { id: true, name: true, email: true, isActive: true } },
};

const resolvePublicStudentByCode = async (studentCode) => {
  const normalizedCode = String(studentCode || "").trim();

  if (!normalizedCode) {
    const error = new Error("Student Code is required");
    error.statusCode = 400;
    throw error;
  }

  const admission = await prisma.admission.findFirst({
    where: {
      admissionCode: {
        equals: normalizedCode,
        mode: "insensitive",
      },
    },
    select: {
      studentId: true,
      schoolId: true,
    },
  });

  const student = admission?.studentId
    ? await prisma.student.findFirst({
        where: {
          id: admission.studentId,
          schoolId: admission.schoolId,
        },
        include: publicStudentInclude,
      })
    : await prisma.student.findFirst({
        where: {
          admissionNumber: {
            equals: normalizedCode,
            mode: "insensitive",
          },
        },
        include: publicStudentInclude,
      });

  if (!student || !student.school?.isActive) {
    const error = new Error("Student Code not found");
    error.statusCode = 404;
    throw error;
  }

  return student;
};

const mapPublicFee = (fee) => ({
  id: fee.id,
  name: fee.feeCategory?.name || "School fee",
  category: fee.feeCategory?.name || "School fee",
  amount: fee.amount,
  quantityRequired: Boolean(fee.quantityRequired),
  className: fee.className || null,
  session: fee.session || null,
  term: fee.term || null,
});

const listPublicFees = (schoolId) => prisma.feeStructure.findMany({
  where: { schoolId, isActive: true, feeCategory: { isActive: true } },
  include: { feeCategory: true },
  orderBy: [{ feeCategory: { name: "asc" } }, { updatedAt: "desc" }],
});

const resolvePublicFee = async (schoolId, feeStructureId) => {
  const fee = await prisma.feeStructure.findFirst({
    where: { id: String(feeStructureId || "").trim(), schoolId, isActive: true, feeCategory: { isActive: true } },
    include: { feeCategory: true },
  });
  if (!fee) {
    const error = new Error("Payment item not found or inactive");
    error.statusCode = 404;
    throw error;
  }
  return fee;
};

export const calculateConfiguredFeeLines = ({ feeStructures, requestedItems }) => {
  const feeById = new Map(feeStructures.map((fee) => [fee.id, fee]));
  const seen = new Set();

  return requestedItems.map((item) => {
    const fee = feeById.get(String(item.feeStructureId || "").trim());
    if (!fee) {
      const error = new Error("Payment item not found or inactive");
      error.statusCode = 404;
      throw error;
    }
    if (seen.has(fee.id)) {
      const error = new Error("Payment items must be unique");
      error.statusCode = 400;
      throw error;
    }
    seen.add(fee.id);

    const requestedQuantity = Number(item.quantity);
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      const error = new Error("Quantity must be at least 1");
      error.statusCode = 400;
      throw error;
    }

    const quantity = fee.quantityRequired ? requestedQuantity : 1;
    const unitAmount = toDecimal(fee.amount);
    return {
      fee,
      quantity,
      unitAmount,
      lineTotal: unitAmount.times(quantity),
    };
  });
};

const resolvePublicFeeLines = async (schoolId, requestedItems) => {
  if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
    const error = new Error("At least one payment item is required");
    error.statusCode = 400;
    throw error;
  }

  const ids = requestedItems.map((item) => String(item.feeStructureId || "").trim());
  const feeStructures = await prisma.feeStructure.findMany({
    where: {
      schoolId,
      id: { in: ids },
      isActive: true,
      feeCategory: { isActive: true },
    },
    include: { feeCategory: true },
  });
  return calculateConfiguredFeeLines({ feeStructures, requestedItems });
};

const resolveFeeCategoryId = async (schoolId, payload) => {
  if (payload.feeCategoryId) {
    const category = await prisma.feeCategory.findFirst({ where: { id: payload.feeCategoryId, schoolId } });
    if (!category) {
      const error = new Error("Fee category not found");
      error.statusCode = 404;
      throw error;
    }
    return category.id;
  }

  const requestedName = String(payload.name || "").trim();
  const name = requestedName.toLowerCase() === "application fee" ? "APPLICATION FEE" : requestedName;
  if (!name) return null;

  const category = await prisma.feeCategory.upsert({
    where: { schoolId_name: { schoolId, name } },
    update: { isActive: true },
    create: { schoolId, name },
  });
  return category.id;
};

export const resolveApplicationPaymentAmount = ({ applicationFee, requestedAmount }) =>
  applicationFee ? toDecimal(applicationFee.amount) : toDecimal(requestedAmount);

export const resolveConfiguredPaymentAmount = ({ feeStructure, requestedAmount }) =>
  feeStructure ? toDecimal(feeStructure.amount) : toDecimal(requestedAmount);

const paymentInclude = {
  student: true,
  invoice: { include: { items: true } },
  receipt: true,
  paymentLines: { include: { feeStructure: { include: { feeCategory: true } } } },
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
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(toDecimal(amount).toNumber());

const calculateTotals = async (schoolId, context = {}) => {
  const [successful, pending, failed, refunded, outstanding] = await Promise.all([
    prisma.payment.aggregate({ where: { schoolId, ...context, status: "Successful" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { schoolId, ...context, status: "Pending" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { schoolId, ...context, status: "Failed" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { schoolId, ...context, status: "Refunded" }, _sum: { amount: true } }),
    prisma.invoice.aggregate({ where: { schoolId, ...context, outstandingBalance: { gt: 0 } }, _sum: { outstandingBalance: true } }),
  ]);

  const [today, month] = await Promise.all([
    prisma.payment.aggregate({
      where: { schoolId, ...context, status: "Successful", paidAt: { gte: startOfDay() } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { schoolId, ...context, status: "Successful", paidAt: { gte: startOfMonth() } },
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
    successfulPayments: await prisma.payment.count({ where: { schoolId, ...context, status: "Successful" } }),
    failedPayments: await prisma.payment.count({ where: { schoolId, ...context, status: "Failed" } }),
    refundedPayments: await prisma.payment.count({ where: { schoolId, ...context, status: "Refunded" } }),
    outstandingFees: outstanding._sum.outstandingBalance || 0,
  };
};

const mapPayment = (payment) => ({
  ...payment,
  status: normalizeStatus(payment.status),
  receiptNumber: payment.receipt?.receiptNumber || null,
  paymentLines: payment.paymentLines?.map((line) => ({
    ...line,
    feeName: line.feeStructure?.feeCategory?.name || "School fee",
  })) || [],
});

export const syncAdmissionVerificationMetadata = async (paymentReference, verificationData = {}) => {
  const payment = await prisma.payment.findUnique({
    where: { reference: paymentReference },
    select: { id: true, schoolId: true, studentId: true, reference: true },
  });

  if (!payment) {
    return { updated: false, reason: "payment_not_found" };
  }

  const verifiedAt = verificationData?.paid_at ? new Date(verificationData.paid_at) : new Date();

  const admission = await prisma.admission.findFirst({
    where: {
      schoolId: payment.schoolId,
      studentId: payment.studentId,
      OR: [
        { status: "admission_offered" },
        { status: "passed" },
        { status: "enrolled" },
        { status: "paid" },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  if (!admission) {
    return { updated: false, reason: "admission_not_found" };
  }

  await prisma.admission.update({
    where: { id: admission.id },
    data: {
      paymentReference,
      verifiedAt,
    },
  });

  return { updated: true, schoolId: payment.schoolId, studentId: payment.studentId, admissionId: admission.id };
};

export const financeService = {
  getPublicStudentLookup: async (query = {}) => {
    const student = await resolvePublicStudentByCode(query.studentCode);
    const fees = await listPublicFees(student.schoolId);
    return {
      student: {
        name: student.name || "Student",
        className: student.className || "Not assigned",
        studentCode: student.admissionNumber || query.studentCode,
      },
      feeStructures: fees.map(mapPublicFee),
    };
  },

  createPublicPayment: async (payload) => {
    const student = await resolvePublicStudentByCode(payload.studentCode);
    const fees = await resolvePublicFeeLines(student.schoolId, payload.feeItems);
    const isApplicationFee = fees.length === 1 && String(fees[0].fee.feeCategory?.name || "").trim().toLowerCase() === "application fee";
    return financeService.createPayment(
      { id: null, email: student.parentEmail, schoolId: student.schoolId },
      {
        studentCode: payload.studentCode,
        studentId: student.id,
        feeItems: payload.feeItems,
        callbackUrl: payload.callbackUrl,
        paymentType: isApplicationFee ? "application_fee" : "school_fee",
      },
    );
  },

  listFeeStructures: async (user, query = {}) =>
    (() => {
      const currentPage = Math.max(1, toNumber(query.page, 1));
      const pageSize = Math.max(1, Math.min(100, toNumber(query.limit, 20)));
      const where = {
        schoolId: getSchoolId(user),
        ...(query.className ? { className: String(query.className).trim() } : {}),
        ...(query.level ? { className: { contains: String(query.level).trim(), mode: "insensitive" } } : {}),
        ...(query.isActive !== undefined ? { isActive: String(query.isActive) === "true" } : {}),
      };
      return Promise.all([
        prisma.feeStructure.count({ where }),
        prisma.feeStructure.findMany({
          where,
          orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
          skip: (currentPage - 1) * pageSize,
          take: pageSize,
          include: { feeCategory: true },
        }),
      ]).then(([total, feeStructures]) => ({
        feeStructures,
        pagination: { page: currentPage, limit: pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
      }));
    })(),

  createFeeStructure: async (user, payload) => {
    const schoolId = getSchoolId(user);
    const amount = toDecimal(payload.amount);
    if (!payload.name && !payload.feeCategoryId) {
      const error = new Error("Fee name or category is required");
      error.statusCode = 400;
      throw error;
    }
    const feeCategoryId = await resolveFeeCategoryId(schoolId, payload);
    if (amount.lte(0)) {
      const error = new Error("Amount must be a positive number");
      error.statusCode = 400;
      throw error;
    }
    const feeStructure = await prisma.feeStructure.create({
      data: {
        schoolId,
        feeCategoryId,
        className: payload.className || null,
        session: payload.session || null,
        term: payload.term || null,
        amount,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
        isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
        quantityRequired: payload.quantityRequired !== undefined ? Boolean(payload.quantityRequired) : false,
      },
      include: { feeCategory: true },
    });
    await recordAuditMutation({ user, schoolId, entity: "Fee", entityId: feeStructure.id, action: "CREATE", after: feeStructure });
    return feeStructure;
  },

  updateFeeStructure: async (user, id, payload) => {
    const schoolId = getSchoolId(user);
    const existing = await prisma.feeStructure.findFirst({ where: { id, schoolId } });
    if (!existing) {
      const error = new Error("Fee structure not found");
      error.statusCode = 404;
      throw error;
    }
    const feeCategoryId = payload.name !== undefined || payload.feeCategoryId !== undefined
      ? await resolveFeeCategoryId(schoolId, payload)
      : undefined;
    if (payload.amount !== undefined && toDecimal(payload.amount).lte(0)) {
      const error = new Error("Amount must be a positive number");
      error.statusCode = 400;
      throw error;
    }
    const updated = await prisma.feeStructure.update({
      where: { id },
      data: {
        feeCategoryId,
        className: payload.className !== undefined ? payload.className || null : undefined,
        session: payload.session !== undefined ? payload.session || null : undefined,
        term: payload.term !== undefined ? payload.term || null : undefined,
        amount: payload.amount !== undefined ? toDecimal(payload.amount) : undefined,
        dueDate: payload.dueDate !== undefined ? (payload.dueDate ? new Date(payload.dueDate) : null) : undefined,
        isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : undefined,
        quantityRequired: payload.quantityRequired !== undefined ? Boolean(payload.quantityRequired) : undefined,
      },
      include: { feeCategory: true },
    });
    await recordAuditMutation({ user, schoolId, entity: "Fee", entityId: id, action: "UPDATE", before: existing, after: updated });
    return updated;
  },

  deleteFeeStructure: async (user, id) => {
    const schoolId = getSchoolId(user);
    const existing = await prisma.feeStructure.findFirst({ where: { id, schoolId } });
    if (!existing) {
      const error = new Error("Fee structure not found");
      error.statusCode = 404;
      throw error;
    }
    const deleted = await prisma.feeStructure.delete({ where: { id } });
    await recordAuditMutation({ user, schoolId, entity: "Fee", entityId: id, action: "DELETE", before: deleted });
    return deleted;
  },

  assignFeeStructure: async (user, payload) => {
    const schoolId = getSchoolId(user);
    const context = await resolveAcademicContext(schoolId, payload);
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
                academicYearId: context.academicYearId,
                termId: context.termId,
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
    const context = await resolveAcademicContext(schoolId, query);
    const currentPage = Math.max(1, toNumber(query.page, 1));
    const pageSize = Math.max(1, Math.min(100, toNumber(query.limit, 20)));
    const where = { schoolId, ...context };

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
    const isPublicPayment = !user.id && payload.studentCode;
    const isApplicationPayment = payload.paymentType === "application_fee";
    const resolvedStudent = isPublicPayment
      ? await resolvePublicStudentByCode(payload.studentCode)
      : isApplicationPayment
      ? await parentAccessService.resolveStudentByCode(user.id, payload.studentCode, schoolId)
      : null;
    const student = resolvedStudent
      ? await prisma.student.findFirst({ where: { id: resolvedStudent.id, schoolId }, include: { school: { select: { email: true } } } })
      : await prisma.student.findFirst({ where: { id: payload.studentId, schoolId }, include: { school: { select: { email: true } } } });
    if (!student) {
      const error = new Error("Student not found");
      error.statusCode = 404;
      throw error;
    }
    const context = await resolveAcademicContext(schoolId, payload);

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

    const invoiceDue = invoices.reduce((sum, invoice) => sum.plus(toDecimal(invoice.outstandingBalance || invoice.totalAmount)), new Prisma.Decimal(0));
    const feeDue = fees.reduce((sum, fee) => sum.plus(toDecimal(fee.outstandingBalance || fee.amount)), new Prisma.Decimal(0));
    const selectedFee = payload.feeStructureId
      ? await resolvePublicFee(schoolId, payload.feeStructureId)
      : null;
    const configuredFeeLines = payload.feeItems
      ? await resolvePublicFeeLines(schoolId, payload.feeItems)
      : selectedFee
      ? calculateConfiguredFeeLines({ feeStructures: [selectedFee], requestedItems: [{ feeStructureId: selectedFee.id, quantity: 1 }] })
      : [];
    const applicationFee = isApplicationPayment
      ? selectedFee || await resolveApplicationFeeStructure(schoolId)
      : null;
    const configuredFee = selectedFee || applicationFee;
    if (isApplicationPayment && !applicationFee) {
      const error = new Error("Application fee is not configured for this school");
      error.statusCode = 400;
      throw error;
    }
    const requestedAmount = payload.amount !== undefined && payload.amount !== null
      ? payload.amount
      : invoiceDue.plus(feeDue);
    const configuredLinesTotal = configuredFeeLines.reduce((sum, line) => sum.plus(line.lineTotal), new Prisma.Decimal(0));
    const amount = configuredFeeLines.length
      ? configuredLinesTotal
      : configuredFee
      ? resolveConfiguredPaymentAmount({ feeStructure: configuredFee, requestedAmount })
      : resolveApplicationPaymentAmount({ applicationFee, requestedAmount });

    if (amount.lte(0)) {
      const error = new Error("Amount must be a positive number");
      error.statusCode = 400;
      throw error;
    }

    const payment = await prisma.$transaction((tx) => tx.payment.create({
      data: {
        schoolId,
        studentId: student.id,
        academicYearId: context.academicYearId,
        termId: context.termId,
        invoiceId: invoices[0]?.id || null,
        method: "Paystack",
        status: "Pending",
        amount,
        paidAt: new Date(),
        reference: payload.reference || `PAY-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
        note: payload.note || (configuredFee ? configuredFee.feeCategory?.name : null),
        createdById: user.id || null,
        paymentLines: configuredFeeLines.length
          ? { create: configuredFeeLines.map((line) => ({
            feeStructureId: line.fee.id,
            quantity: line.quantity,
            unitAmount: line.unitAmount,
            lineTotal: line.lineTotal,
          })) }
          : undefined,
      },
      include: paymentInclude,
    }));
    await recordAuditMutation({ user, schoolId, entity: "Payment", entityId: payment.id, action: "CREATE", after: payment });

    const metadata = {
      studentId: student.id,
      invoiceIds,
      studentFeeIds,
      schoolId,
      totalDue: invoiceDue.plus(feeDue).toFixed(2),
      ...(applicationFee ? { applicationFeeId: applicationFee.id } : {}),
      ...(configuredFee ? { feeStructureId: configuredFee.id, feeName: configuredFee.feeCategory?.name || "School fee" } : {}),
      ...(configuredFeeLines.length ? {
        feeItems: configuredFeeLines.map((line) => ({
          feeStructureId: line.fee.id,
          feeName: line.fee.feeCategory?.name || "School fee",
          quantity: line.quantity,
          unitAmount: line.unitAmount.toFixed(2),
          lineTotal: line.lineTotal.toFixed(2),
        })),
      } : {}),
      ...(isApplicationPayment ? { paymentType: "application_fee", studentCode: payload.studentCode } : {}),
    };

    const session = await paystackService.initializePayment({
      amount,
      email: student.parentEmail || user.email || student.school.email,
      userId: user.id || null,
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
        amount: payload.amount !== undefined ? toDecimal(payload.amount) : undefined,
        paidAt: payload.paidAt ? new Date(payload.paidAt) : undefined,
        note: payload.note,
      },
      include: paymentInclude,
    });
    await recordAuditMutation({ user, schoolId: existing.schoolId, entity: "Payment", entityId: id, action: "UPDATE", before: existing, after: updated });
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
    const deleted = await prisma.payment.delete({ where: { id } });
    await recordAuditMutation({ user, schoolId: existing.schoolId, entity: "Payment", entityId: id, action: "DELETE", before: deleted });
    return deleted;
  },

  listInvoices: async (user, query = {}) => {
    const schoolId = getSchoolId(user);
    const page = Math.max(1, toNumber(query.page, 1));
    const limit = Math.max(1, Math.min(100, toNumber(query.limit, 20)));
    const where = { schoolId };
    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { items: true, payments: true, student: true },
      }),
    ]);
    return { invoices, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  },

  listInstallmentPlans: async (user, query = {}) => {
    const schoolId = getSchoolId(user);
    const page = Math.max(1, toNumber(query.page, 1));
    const limit = Math.max(1, Math.min(100, toNumber(query.limit, 20)));
    const where = { schoolId };
    const [total, installmentPlans] = await Promise.all([
      prisma.installmentPlan.count({ where }),
      prisma.installmentPlan.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { student: true, payments: true },
      }),
    ]);
    return { installmentPlans, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  },

  getCashflow: async (user, query = {}) => {
    const schoolId = getSchoolId(user);
    const context = await resolveAcademicContext(schoolId, query);
    const parseBoundary = (value, end = false) => {
      if (!value) return null;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return null;
      date.setHours(end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0);
      return date;
    };
    const range = {};
    if (query.startDate) { const start = parseBoundary(query.startDate); if (start) range.gte = start; }
    if (query.endDate) { const end = parseBoundary(query.endDate, true); if (end) range.lte = end; }
    const paymentDate = Object.keys(range).length ? { paidAt: range } : {};
    const expenseDate = Object.keys(range).length ? { occurredAt: range } : {};
    const [payments, expenses] = await Promise.all([
      prisma.payment.findMany({ where: { schoolId, ...context, ...paymentDate }, orderBy: { paidAt: "desc" }, take: 100, include: { student: true } }),
      prisma.expense.findMany({ where: { schoolId, ...expenseDate }, orderBy: { occurredAt: "desc" }, take: 100, include: { expenseCategory: true } }),
    ]);

    const [revenue, expenseTotal, outstanding, todayRevenue, monthRevenue, yearRevenue, categoryRows] = await Promise.all([
      prisma.payment.aggregate({ where: { schoolId, ...context, status: "Successful" }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { schoolId }, _sum: { amount: true } }),
      prisma.invoice.aggregate({ where: { schoolId, ...context, outstandingBalance: { gt: 0 } }, _sum: { outstandingBalance: true } }),
      prisma.payment.aggregate({ where: { schoolId, ...context, status: "Successful", paidAt: { gte: startOfDay() } }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { schoolId, ...context, status: "Successful", paidAt: { gte: startOfMonth() } }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { schoolId, ...context, status: "Successful", paidAt: { gte: new Date(new Date().getFullYear(), 0, 1) } }, _sum: { amount: true } }),
      prisma.expense.findMany({ where: { schoolId }, select: { amount: true, expenseCategory: { select: { id: true, name: true } } } }),
    ]);

    const expensesByCategory = Object.values(categoryRows.reduce((acc, row) => {
      const key = row.expenseCategory?.id || "uncategorized";
      if (!acc[key]) acc[key] = { categoryId: row.expenseCategory?.id || null, category: row.expenseCategory?.name || "Uncategorized", amount: new Prisma.Decimal(0) };
      acc[key].amount = toDecimal(acc[key].amount).plus(toDecimal(row.amount));
      return acc;
    }, {}));

    return {
      totalRevenue: revenue._sum.amount || 0,
      totalExpenses: expenseTotal._sum.amount || 0,
      netIncome: toDecimal(revenue._sum.amount).minus(toDecimal(expenseTotal._sum.amount)),
      outstandingFees: outstanding._sum.outstandingBalance || 0,
      revenueToday: todayRevenue._sum.amount || 0,
      revenueThisMonth: monthRevenue._sum.amount || 0,
      revenueThisYear: yearRevenue._sum.amount || 0,
      expensesByCategory,
      monthlyRevenue: [],
      monthlyExpense: [],
      recentTransactions: payments.map((payment) => ({ ...payment, type: "Payment" })),
      recentExpenses: expenses,
    };
  },

  getParentFees: async (user, query = {}) => {
    const schoolId = getSchoolId(user);
    const studentCode = String(query.studentCode || "").trim();
    const applicationFee = await resolveApplicationFeeStructure(schoolId);
    const children = await parentAccessService.listChildren(user.id, schoolId);
    const requestedStudentId = String(query.studentId || "").trim();
    const selectedChild = studentCode
      ? await parentAccessService.resolveStudentByCode(user.id, studentCode, schoolId)
      : requestedStudentId
      ? await parentAccessService.assertStudentAccess(user.id, requestedStudentId, schoolId)
      : children[0] || null;
    if (!selectedChild) {
      return { student: null, children, fees: [], payments: [], feeStructures: [], applicationFee, applicationPayment: null, summary: { totalDue: 0, totalPaid: 0, outstandingFees: 0 } };
    }

    if (studentCode) {
      return {
        student: selectedChild,
        children: [selectedChild],
        fees: [],
        invoices: [],
        payments: [],
        feeStructures: [],
        applicationFee,
        applicationPayment: null,
        summary: { totalDue: 0, totalPaid: 0, outstandingFees: 0 },
      };
    }

    const context = await resolveAcademicContext(schoolId, query);

    const [fees, invoices, payments, structures] = await Promise.all([
      prisma.studentFee.findMany({ where: { schoolId, ...context, studentId: selectedChild.id }, include: { feeStructure: { include: { feeCategory: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.invoice.findMany({ where: { schoolId, ...context, studentId: selectedChild.id }, include: { items: true, payments: true }, orderBy: { createdAt: "desc" } }),
      prisma.payment.findMany({ where: { schoolId, ...context, studentId: selectedChild.id }, include: paymentInclude, orderBy: { createdAt: "desc" } }),
      prisma.feeStructure.findMany({ where: { schoolId, isActive: true }, include: { feeCategory: true }, orderBy: { createdAt: "desc" } }),
    ]);
    const mappedPayments = payments.map(mapPayment);
    const totalDue = fees.reduce((sum, fee) => sum.plus(toDecimal(fee.amount)), new Prisma.Decimal(0)).plus(
      invoices.reduce((sum, invoice) => sum.plus(toDecimal(invoice.totalAmount)), new Prisma.Decimal(0)),
    );
    const totalPaid = mappedPayments
      .filter((payment) => payment.status === "Paid" || payment.status === "Successful")
      .reduce((sum, payment) => sum.plus(toDecimal(payment.amount)), new Prisma.Decimal(0));
    const summary = normalizeRole(user.role) === "parent"
      ? { totalDue, totalPaid, outstandingFees: totalDue.gt(totalPaid) ? totalDue.minus(totalPaid) : new Prisma.Decimal(0) }
      : await calculateTotals(schoolId, context);
    const applicationPayment = mappedPayments.find((payment) => payment.note === "Admission application fee") || null;
    return {
      student: selectedChild,
      children,
      fees,
      invoices,
      payments: mappedPayments,
      feeStructures: structures,
      applicationFee,
      applicationPayment,
      summary,
    };
  },

  getAdminWallet: async (user) => {
    const schoolId = getSchoolId(user);
    const context = await resolveAcademicContext(schoolId);
    const [summary, recentPayments, settings, bankDetails, refunds] = await Promise.all([
      calculateTotals(schoolId, context),
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
      const lockedRows = await tx.$queryRaw`SELECT "id" FROM "Payment" WHERE "reference" = ${reference} FOR UPDATE`;
      if (!lockedRows.length) {
        throw Object.assign(new Error("Payment record not found"), { statusCode: 404 });
      }

      const lockedPayment = await tx.payment.findUnique({ where: { reference }, include: paymentInclude });
      if (!lockedPayment) {
        throw Object.assign(new Error("Payment record not found"), { statusCode: 404 });
      }
      if (["Successful", "Refunded"].includes(lockedPayment.status)) {
        return { payment: lockedPayment, alreadyProcessed: true };
      }

      const payment = await tx.payment.update({
        where: { reference },
        data: { status: "Successful", paidAt, method: "Paystack" },
        include: paymentInclude,
      });
      const invoiceIds = Array.isArray(metadata.invoiceIds) ? metadata.invoiceIds : [];
      const studentFeeIds = Array.isArray(metadata.studentFeeIds) ? metadata.studentFeeIds : [];
      let remaining = toDecimal(payment.amount);

      if (invoiceIds.length) {
        const invoices = await tx.invoice.findMany({ where: { id: { in: invoiceIds }, schoolId } });
        for (const invoice of invoices) {
          if (remaining <= 0) break;
          const currentOutstanding = toDecimal(invoice.outstandingBalance || invoice.totalAmount);
          const paymentPortion = remaining.lt(currentOutstanding) ? remaining : currentOutstanding;
          const newOutstanding = currentOutstanding.minus(paymentPortion);
          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              outstandingBalance: newOutstanding,
              status: newOutstanding.lte(0) ? "Paid" : "Partially Paid",
            },
          });
          remaining = remaining.minus(paymentPortion);
        }
      }

      if (studentFeeIds.length && remaining > 0) {
        const fees = await tx.studentFee.findMany({ where: { id: { in: studentFeeIds }, schoolId } });
        for (const fee of fees) {
          if (remaining <= 0) break;
          const currentOutstanding = toDecimal(fee.outstandingBalance || fee.amount);
          const paymentPortion = remaining.lt(currentOutstanding) ? remaining : currentOutstanding;
          const newOutstanding = currentOutstanding.minus(paymentPortion);
          await tx.studentFee.update({ where: { id: fee.id }, data: { outstandingBalance: newOutstanding, status: newOutstanding.lte(0) ? "Paid" : "Partially Paid" } });
          remaining = remaining.minus(paymentPortion);
        }
      }

      if (!invoiceIds.length && !studentFeeIds.length && payment.invoiceId) {
        const invoice = await tx.invoice.findUnique({ where: { id: payment.invoiceId } });
        if (invoice) {
          const currentOutstanding = toDecimal(invoice.outstandingBalance || invoice.totalAmount);
          const newOutstanding = currentOutstanding.minus(toDecimal(payment.amount));
          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              outstandingBalance: newOutstanding,
              status: newOutstanding.lte(0) ? "Paid" : "Partially Paid",
            },
          });
        }
      }

      if (!invoiceIds.length && !studentFeeIds.length) {
        const fees = await tx.studentFee.findMany({ where: { studentId: existing.studentId, schoolId, outstandingBalance: { gt: 0 } }, orderBy: { createdAt: "asc" } });
        for (const fee of fees) {
          if (remaining <= 0) break;
          const currentOutstanding = toDecimal(fee.outstandingBalance || fee.amount);
          const paymentPortion = remaining.lt(currentOutstanding) ? remaining : currentOutstanding;
          const newOutstanding = currentOutstanding.minus(paymentPortion);
          await tx.studentFee.update({ where: { id: fee.id }, data: { outstandingBalance: newOutstanding, status: newOutstanding.lte(0) ? "Paid" : "Partially Paid" } });
          remaining = remaining.minus(paymentPortion);
        }
      }

      const receipt = await tx.receipt.upsert({
        where: { paymentId: payment.id },
        update: {},
        create: { schoolId, paymentId: payment.id, receiptNumber: makeReceiptNumber() },
      });
      return { payment: { ...payment, receipt }, alreadyProcessed: false };
    });

    if (updated.alreadyProcessed) return mapPayment(updated.payment);

    await syncAdmissionVerificationMetadata(reference, verificationData);

    const student = await prisma.student.findUnique({ where: { id: existing.studentId } });
    await notifyUser({ schoolId, userId: student?.parentId || existing.createdById, title: "Payment successful", body: `Payment ${reference} has been verified.` });
    await notifyUser({ schoolId, userId: existing.createdById, title: "Receipt available", body: `Receipt for ${reference} is now available.` });
    await notifyAdmin({ schoolId, title: "Payment received", body: `Payment ${reference} was verified successfully.` });
    return mapPayment(updated.payment);
  },

  processFailedPayment: async (reference, reason) => {
    const existing = await prisma.payment.findUnique({ where: { reference }, include: paymentInclude });
    if (!existing) {
      throw Object.assign(new Error("Payment record not found"), { statusCode: 404 });
    }
    const updated = await prisma.$transaction(async (tx) => {
      const lockedRows = await tx.$queryRaw`SELECT "id" FROM "Payment" WHERE "reference" = ${reference} FOR UPDATE`;
      if (!lockedRows.length) {
        throw Object.assign(new Error("Payment record not found"), { statusCode: 404 });
      }
      const lockedPayment = await tx.payment.findUnique({ where: { reference }, include: paymentInclude });
      if (!lockedPayment || ["Successful", "Refunded", "Failed"].includes(lockedPayment.status)) {
        return { payment: lockedPayment || existing, alreadyProcessed: true };
      }
      return {
        payment: await tx.payment.update({
          where: { reference },
          data: { status: "Failed" },
          include: paymentInclude,
        }),
        alreadyProcessed: false,
      };
    });
    if (updated.alreadyProcessed) return mapPayment(updated.payment);
    await notifyUser({ schoolId: existing.schoolId, userId: existing.createdById, title: "Payment failed", body: `Payment ${reference} failed: ${reason || "Paystack verification failed"}.` });
    await notifyAdmin({ schoolId: existing.schoolId, title: "Payment failed", body: `Payment ${reference} failed verification.` });
    return mapPayment(updated.payment);
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

