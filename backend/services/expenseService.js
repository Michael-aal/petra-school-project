import { Prisma } from "@prisma/client";
import { prisma } from "../config/db.js";
import { recordAuditMutation } from "../middleware/audit.js";
import { resolveAcademicContext } from "../utils/academicContext.js";

const getSchoolId = (user) => {
  if (!user?.schoolId) {
    const error = new Error("School context missing");
    error.statusCode = 403;
    throw error;
  }
  return Number(user.schoolId);
};

const toDecimal = (value) => {
  const amount = new Prisma.Decimal(String(value ?? "0"));
  if (!amount.gt(0)) {
    const error = new Error("Expense amount must be greater than zero");
    error.statusCode = 400;
    throw error;
  }
  return amount;
};

export const expenseService = {
  listCategories: async (user) => {
    const schoolId = getSchoolId(user);
    return prisma.expenseCategory.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
    });
  },

  createExpense: async (user, payload) => {
    const schoolId = getSchoolId(user);
    const title = String(payload?.title || "").trim();
    const categoryName = String(payload?.category || payload?.categoryName || "").trim();
    const note = String(payload?.note || payload?.description || "").trim() || null;
    const occurredAt = payload?.occurredAt ? new Date(payload.occurredAt) : new Date();

    if (!title) {
      const error = new Error("Expense name is required");
      error.statusCode = 400;
      throw error;
    }
    if (title.length > 200) {
      const error = new Error("Expense name must be 200 characters or less");
      error.statusCode = 400;
      throw error;
    }
    if (Number.isNaN(occurredAt.getTime())) {
      const error = new Error("Expense date is invalid");
      error.statusCode = 400;
      throw error;
    }

    const amount = toDecimal(payload?.amount);
    const academicContext = await resolveAcademicContext(schoolId, { academicYearId: payload?.academicYearId, termId: payload?.termId });

    let expenseCategoryId = payload?.categoryId ? String(payload.categoryId).trim() : null;
    if (expenseCategoryId) {
      const category = await prisma.expenseCategory.findFirst({ where: { id: expenseCategoryId, schoolId } });
      if (!category) {
        const error = new Error("Expense category not found");
        error.statusCode = 404;
        throw error;
      }
    } else if (categoryName) {
      const category = await prisma.expenseCategory.upsert({
        where: { schoolId_name: { schoolId, name: categoryName } },
        update: {},
        create: { schoolId, name: categoryName },
      });
      expenseCategoryId = category.id;
    }

    const expense = await prisma.expense.create({
      data: {
        schoolId,
        expenseCategoryId,
        academicYearId: academicContext.academicYearId || null,
        termId: academicContext.termId || null,
        createdById: user.id || null,
        title,
        amount,
        occurredAt,
        note,
      },
      include: { expenseCategory: true, createdBy: { select: { id: true, name: true, email: true } } },
    });

    await recordAuditMutation({
      user,
      schoolId,
      entity: "Expense",
      entityId: expense.id,
      action: "CREATE",
      after: expense,
    });

    return expense;
  },
};
