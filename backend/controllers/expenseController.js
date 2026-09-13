import { expenseService } from "../services/expenseService.js";

export const listExpenseCategories = async (req, res, next) => {
  try {
    return res.json({ success: true, categories: await expenseService.listCategories(req.user) });
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req, res, next) => {
  try {
    return res.status(201).json({
      success: true,
      expense: await expenseService.createExpense(req.user, req.body),
    });
  } catch (error) {
    next(error);
  }
};
