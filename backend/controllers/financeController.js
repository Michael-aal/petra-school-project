import { validationResult } from "express-validator";
import { financeService } from "../services/financeService.js";

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

export const createPayment = async (req, res, next) => {
  try {
    const invalid = validate(req, res);
    if (invalid) return invalid;
    return res.status(201).json({ success: true, payment: await financeService.createPayment(req.user, req.body) });
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
    return res.json({ success: true, invoices: await financeService.listInvoices(req.user) });
  } catch (error) {
    next(error);
  }
};

export const getFeeStructures = async (req, res, next) => {
  try {
    return res.json({ success: true, feeStructures: await financeService.listFeeStructures(req.user) });
  } catch (error) {
    next(error);
  }
};

export const getInstallmentPlans = async (req, res, next) => {
  try {
    return res.json({ success: true, installmentPlans: await financeService.listInstallmentPlans(req.user) });
  } catch (error) {
    next(error);
  }
};

export const getCashflow = async (req, res, next) => {
  try {
    return res.json({ success: true, ...(await financeService.getCashflow(req.user)) });
  } catch (error) {
    next(error);
  }
};
