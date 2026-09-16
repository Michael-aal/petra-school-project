import { walletService } from "../services/walletService.js";

const sanitizeWalletResponse = (wallet) => {
  if (!wallet) return wallet;
  const { notificationPreferences, ...safeWallet } = wallet;
  const configured = Boolean(
    notificationPreferences &&
      typeof notificationPreferences === "object" &&
      !Array.isArray(notificationPreferences) &&
      notificationPreferences.withdrawalPinHash,
  );
  return { wallet: safeWallet, withdrawalPinConfigured: configured };
};

export const getWallet = async (req, res, next) => {
  try {
    const data = await walletService.getWalletSummary(req.user.id, req.user.email);
    const safe = sanitizeWalletResponse(data.wallet);
    return res.status(200).json({
      success: true,
      ...data,
      ...safe,
      summary: { ...data.summary, withdrawalPinConfigured: safe.withdrawalPinConfigured },
    });
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

export const setWithdrawalPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    const result = await walletService.setWithdrawalPin(req.user.id, pin);
    return res.status(200).json({
      success: true,
      ...result,
      message: "Withdrawal PIN configured successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const withdrawWallet = async (req, res, next) => {
  try {
    const {
      amount,
      description,
      bankCode,
      bankName,
      accountNumber,
      accountName,
      pin,
    } = req.body;

    const idempotencyKey = req.get("Idempotency-Key") || req.body.idempotencyKey;

    const result = await walletService.withdraw(req.user.id, {
      amount,
      description,
      bankCode,
      bankName,
      accountNumber,
      accountName,
      pin,
      idempotencyKey,
    });

    return res.status(result.duplicate ? 200 : 202).json({
      success: true,
      duplicate: result.duplicate,
      transaction: result.transaction,
      wallet: sanitizeWalletResponse(result.wallet).wallet,
      message: result.duplicate
        ? "The withdrawal request was already received; no second withdrawal was created."
        : "Withdrawal request created successfully and is pending processing.",
    });
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
