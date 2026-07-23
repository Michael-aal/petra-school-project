import { walletService } from "../services/walletService.js";

export const getWallet = async (req, res, next) => {
  try {
    const data = await walletService.getWalletSummary(req.user.id, req.user.email);
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const transactions = await walletService.getTransactions(req.user.id);
    return res.status(200).json({ success: true, transactions });
  } catch (error) {
    next(error);
  }
};

export const getStatement = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const transactions = await walletService.getTransactions(req.user.id, startDate, endDate);
    return res.status(200).json({ success: true, transactions });
  } catch (error) {
    next(error);
  }
};

export const withdrawWallet = async (req, res, next) => {
  try {
    const { amount, description } = req.body;
    const wallet = await walletService.withdraw(req.user.id, amount, description);
    return res.status(200).json({ success: true, wallet, message: "Withdrawal request completed" });
  } catch (error) {
    next(error);
  }
};

export const transferWallet = async (req, res, next) => {
  try {
    const { recipient, amount, note } = req.body;
    const wallet = await walletService.transfer(req.user.id, recipient, amount, note);
    return res.status(200).json({ success: true, wallet, message: "Transfer completed successfully" });
  } catch (error) {
    next(error);
  }
};

export const initializePaystack = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const session = await walletService.initializePaystack(req.user.id, req.user.email, amount);
    return res.status(200).json({ success: true, session });
  } catch (error) {
    next(error);
  }
};
