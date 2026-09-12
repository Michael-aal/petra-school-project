import { validationResult } from "express-validator";
import { financeService } from "../services/financeService.js";
import { prisma } from "../config/db.js";

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  return null;
};

export const listPayments = async (req, res, next) => {
  try {
    return res.json({ success: true, ...(await financeService.listPayments(req.user, req.query)) });
  } catch (error) {
    next(error);
  }
};

export const getPayment = async (req, res, next) => {
  try {
    return res.json({ success: true, payment: await financeService.getPaymentById(req.user, req.params.id) });
  } catch (error) {
    next(error);
  }
};

export const getPaymentReceipt = async (req, res, next) => {
  try {
    const receiptData = await financeService.getPaymentReceipt(req.user, req.params.id);
    const receiptText = `Receipt Number: ${receiptData.receipt.receiptNumber}\n` +
      `Student: ${receiptData.student?.name || "Unknown"}\n` +
      `Payment Reference: ${receiptData.payment.reference}\n` +
      `Amount: NGN ${receiptData.payment.amount.toFixed(2)}\n` +
      `Status: ${receiptData.payment.status}\n` +
      (receiptData.payment.paymentLines?.length
        ? `Items: ${receiptData.payment.paymentLines.map((line) => `${line.feeName} x ${line.quantity} = NGN ${line.lineTotal.toFixed(2)}`).join("; ")}\n`
        : "") +
      `Issued At: ${new Date(receiptData.receipt.issuedAt).toLocaleString()}\n` +
      `Invoice Number: ${receiptData.invoice?.invoiceNumber || "N/A"}\n` +
      `Notes: ${receiptData.payment.note || "None"}\n`;

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename="receipt-${receiptData.receipt.receiptNumber}.txt"`);
    return res.send(receiptText);
  } catch (error) {
    next(error);
  }
};

export const createPayment = async (req, res, next) => {
  try {
    const invalid = validate(req, res);
    if (invalid) return invalid;
    return res.status(201).json({ success: true, ...(await financeService.createPayment(req.user, req.body)) });
  } catch (error) {
    next(error);
  }
};

export const updatePayment = async (req, res, next) => {
  try {
    const invalid = validate(req, res);
    if (invalid) return invalid;
    return res.json({ success: true, payment: await financeService.updatePayment(req.user, req.params.id, req.body) });
  } catch (error) {
    next(error);
  }
};

export const deletePayment = async (req, res, next) => {
  try {
    await financeService.deletePayment(req.user, req.params.id);
    return res.json({ success: true, message: "Payment deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const getInvoices = async (req, res, next) => {
  try {
    return res.json({ success: true, ...(await financeService.listInvoices(req.user, req.query)) });
  } catch (error) {
    next(error);
  }
};

export const getFeeStructures = async (req, res, next) => {
  try {
    return res.json({ success: true, ...(await financeService.listFeeStructures(req.user, req.query)) });
  } catch (error) {
    next(error);
  }
};

export const getInstallmentPlans = async (req, res, next) => {
  try {
    return res.json({ success: true, ...(await financeService.listInstallmentPlans(req.user, req.query)) });
  } catch (error) {
    next(error);
  }
};

export const getCashflow = async (req, res, next) => {
  try {
    return res.json({ success: true, ...(await financeService.getCashflow(req.user, req.query)) });
  } catch (error) {
    next(error);
  }
};

export const getParentFees = async (req, res, next) => {
  try {
    return res.json({ success: true, ...(await financeService.getParentFees(req.user, req.query)) });
  } catch (error) {
    next(error);
  }
};

export const getPublicStudentLookup = async (req, res, next) => {
  try {
    const invalid = validate(req, res);
    if (invalid) return invalid;
    return res.json({ success: true, ...(await financeService.getPublicStudentLookup(req.query)) });
  } catch (error) {
    next(error);
  }
};

export const createPublicPayment = async (req, res, next) => {
  try {
    const invalid = validate(req, res);
    if (invalid) return invalid;
    return res.status(201).json({
      success: true,
      ...(await financeService.createPublicPayment(req.body)),
    });
  } catch (error) {
    next(error);
  }
};

export const getSchoolStudentLookup = async (req, res, next) => {
  try {
    const invalid = validate(req, res);
    if (invalid) return invalid;

    const schoolId = Number(req.user?.schoolId);
    if (!Number.isInteger(schoolId) || schoolId <= 0) {
      return res.status(403).json({ success: false, message: "School context missing" });
    }

    const code = String(req.query.studentCode || "").trim();
    const admission = await prisma.admission.findFirst({
      where: {
        schoolId,
        admissionCode: { equals: code, mode: "insensitive" },
      },
      select: { studentId: true },
    });

    const student = admission?.studentId
      ? await prisma.student.findFirst({
          where: { id: admission.studentId, schoolId },
          select: { id: true, name: true, className: true, admissionNumber: true },
        })
      : await prisma.student.findFirst({
          where: { schoolId, admissionNumber: { equals: code, mode: "insensitive" } },
          select: { id: true, name: true, className: true, admissionNumber: true },
        });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student Code not found in the selected school" });
    }

    const feeStructures = await prisma.feeStructure.findMany({
      where: { schoolId, isActive: true, feeCategory: { isActive: true } },
      include: { feeCategory: true },
      orderBy: [{ feeCategory: { name: "asc" } }, { updatedAt: "desc" }],
    });

    return res.json({
      success: true,
      student: {
        id: student.id,
        name: student.name || "Student",
        className: student.className || "Not assigned",
        studentCode: student.admissionNumber || code,
      },
      feeStructures: feeStructures.map((fee) => ({
        id: fee.id,
        name: fee.feeCategory?.name || "School fee",
        category: fee.feeCategory?.name || "School fee",
        amount: fee.amount,
        quantityRequired: Boolean(fee.quantityRequired),
        className: fee.className || null,
        session: fee.session || null,
        term: fee.term || null,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const createSchoolPayment = async (req, res, next) => {
  try {
    const invalid = validate(req, res);
    if (invalid) return invalid;
    return res.status(201).json({
      success: true,
      ...(await financeService.createPayment(req.user, {
        ...req.body,
        paymentType: req.body.paymentType || "school_fee",
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const createFeeStructure = async (req, res, next) => {
  try {
    return res.status(201).json({ success: true, feeStructure: await financeService.createFeeStructure(req.user, req.body) });
  } catch (error) {
    next(error);
  }
};

export const updateFeeStructure = async (req, res, next) => {
  try {
    return res.json({ success: true, feeStructure: await financeService.updateFeeStructure(req.user, req.params.id, req.body) });
  } catch (error) {
    next(error);
  }
};

export const deleteFeeStructure = async (req, res, next) => {
  try {
    await financeService.deleteFeeStructure(req.user, req.params.id);
    return res.json({ success: true, message: "Fee structure deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const assignFeeStructure = async (req, res, next) => {
  try {
    return res.json({ success: true, ...(await financeService.assignFeeStructure(req.user, req.body)) });
  } catch (error) {
    next(error);
  }
};

export const getAdminWallet = async (req, res, next) => {
  try {
    return res.json({ success: true, ...(await financeService.getAdminWallet(req.user)) });
  } catch (error) {
    next(error);
  }
};
