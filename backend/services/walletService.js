import { prisma } from "../config/db.js";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { walletModel } from "../models/walletModel.js";
import { userModel } from "../models/userModel.js";
import { paystackService } from "./paystackService.js";
import { recordAuditMutation } from "../middleware/audit.js";

const generateAccountNumber = () => Math.floor(1000000000 + Math.random() * 9000000000).toString();
const buildReference = () => `wallet_tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`.toLowerCase();
const toDecimal = (value) => value instanceof Prisma.Decimal ? value : new Prisma.Decimal(String(value ?? 0));

const getUser = async (userId, email) => {
  if (userId) {
    const user = await userModel.findById(userId);
    if (user) return user;
  }
  if (email) return userModel.findByEmail(email);
  return null;
};

const createWallet = async (userId, email) => {
  const user = await getUser(userId, email);
  const accountName = user?.fullName || email || "Petra School Wallet";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await walletModel.create({
        userId,
        accountNumber: generateAccountNumber(),
        accountName,
        bankName: "Petra Bank",
        bankCode: "101",
        currency: "NGN",
        balance: new Prisma.Decimal(0),
      });
    } catch (error) {
      if (error?.code === "P2002" && attempt < 4) continue;
      throw error;
    }
  }

  throw new Error("Unable to create wallet account number");
};

const ensureWallet = async (userId, email) => {
  let wallet = await walletModel.findByUserId(userId);
  if (!wallet) {
    try {
      wallet = await createWallet(userId, email);
    } catch (error) {
      if (error?.code === "P2002") wallet = await walletModel.findByUserId(userId);
      if (!wallet) throw error;
    }
  }
  return wallet;
};

const getWithdrawalPinHash = (wallet) => {
  const preferences = wallet?.notificationPreferences;
  return preferences && typeof preferences === "object" && !Array.isArray(preferences)
    ? preferences.withdrawalPinHash || null
    : null;
};

const validateWithdrawalPin = (pin) => {
  const normalized = String(pin ?? "").trim();
  if (!/^\d{4,6}$/.test(normalized)) {
    const error = new Error("Withdrawal PIN must contain 4 to 6 digits");
    error.statusCode = 400;
    throw error;
  }
  return normalized;
};

const validateIdempotencyKey = (key) => {
  const normalized = String(key ?? "").trim();
  if (!normalized || normalized.length < 16 || normalized.length > 100) {
    const error = new Error("A valid idempotency key is required for withdrawals");
    error.statusCode = 400;
    throw error;
  }
  return normalized;
};

const mergeMetadata = (metadata, patch) => ({
  ...(metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {}),
  ...patch,
});

const isWalletDeposit = (payload) => {
  const metadata = payload?.data?.metadata || {};
  return metadata?.purpose === "wallet_deposit" || Boolean(metadata?.walletUserId);
};

export const walletService = {
  getWalletSummary: async (userId, email) => {
    const wallet = await ensureWallet(userId, email);
    const transactions = await walletModel.findRecentTransactions(userId, 8);

    const totals = transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === "DEPOSIT") acc.deposits = acc.deposits.plus(toDecimal(transaction.amount));
        if (transaction.type === "WITHDRAW") acc.withdrawals = acc.withdrawals.plus(toDecimal(transaction.amount));
        if (transaction.type === "TRANSFER") acc.transfers = acc.transfers.plus(toDecimal(transaction.amount));
        return acc;
      },
      { deposits: new Prisma.Decimal(0), withdrawals: new Prisma.Decimal(0), transfers: new Prisma.Decimal(0) },
    );

    return {
      wallet,
      transactions,
      summary: {
        balance: wallet.balance,
        totalDeposits: totals.deposits,
        totalWithdrawals: totals.withdrawals,
        totalTransfers: totals.transfers,
      },
    };
  },

  getTransactions: async (userId, startDate, endDate) => walletModel.findTransactions({ userId, startDate, endDate }),

  setWithdrawalPin: async (userId, pin) => {
    const normalizedPin = validateWithdrawalPin(pin);
    const wallet = await ensureWallet(userId);
    const currentPreferences = wallet.notificationPreferences && typeof wallet.notificationPreferences === "object" && !Array.isArray(wallet.notificationPreferences)
      ? wallet.notificationPreferences
      : {};

    const withdrawalPinHash = await bcrypt.hash(normalizedPin, 12);
    const updatedWallet = await walletModel.update(
      { id: wallet.id },
      { notificationPreferences: { ...currentPreferences, withdrawalPinHash } },
    );

    return { configured: Boolean(getWithdrawalPinHash(updatedWallet)) };
  },

  withdraw: async (userId, { amount, description, bankCode, bankName, accountNumber, accountName, pin, idempotencyKey }) => {
    const parsedAmount = toDecimal(amount);
    if (parsedAmount.lte(0)) {
      const error = new Error("Withdrawal amount must be a positive number");
      error.statusCode = 400;
      throw error;
    }

    const normalizedPin = validateWithdrawalPin(pin);
    const normalizedIdempotencyKey = validateIdempotencyKey(idempotencyKey);
    const existingTransaction = await prisma.transaction.findUnique({ where: { idempotencyKey: normalizedIdempotencyKey } });
    if (existingTransaction) {
      if (existingTransaction.userId !== userId || existingTransaction.type !== "WITHDRAW") {
        const error = new Error("This idempotency key is already used by another transaction");
        error.statusCode = 409;
        throw error;
      }
      return { transaction: existingTransaction, wallet: await walletModel.findByUserId(userId), duplicate: true };
    }

    const wallet = await ensureWallet(userId);
    if (toDecimal(wallet.balance).lt(parsedAmount)) {
      const error = new Error("Insufficient wallet balance");
      error.statusCode = 400;
      throw error;
    }

    const newBalance = toDecimal(wallet.balance).minus(parsedAmount);

    const [updatedWallet] = await prisma.$transaction([
      walletModel.update({ userId }, { balance: newBalance }),
      walletModel.createTransaction({
        walletId: wallet.id,
        userId,
        reference: buildReference(),
        type: "WITHDRAW",
        amount: parsedAmount,
        status: "completed",
        description: description || "Wallet withdrawal",
        source: "Wallet",
        destination: "Bank transfer",
        metadata: { note: description || "withdrawal" },
      }),
    ]);

    return updatedWallet;
  },

  transfer: async (userId, recipient, amount, note) => {
    const parsedAmount = toDecimal(amount);
    if (parsedAmount.lte(0)) {
      const error = new Error("Transfer amount must be a positive number");
      error.statusCode = 400;
      throw error;
    }

    const senderWallet = await ensureWallet(userId);
    if (toDecimal(senderWallet.balance).lt(parsedAmount)) {
      const error = new Error("Insufficient balance to transfer");
      error.statusCode = 400;
      throw error;
    }

    const recipientWallet = recipient.includes("@")
      ? await (async () => {
          const recipientUser = await userModel.findByEmail(recipient);
          if (!recipientUser) return null;
          return ensureWallet(recipientUser.id, recipientUser.email);
        })()
      : await walletModel.findByAccountNumber(recipient);

    if (!recipientWallet) {
      const error = new Error("Recipient wallet was not found");
      error.statusCode = 404;
      throw error;
    }
    if (recipientWallet.userId === userId) {
      const error = new Error("You cannot transfer to your own account");
      error.statusCode = 400;
      throw error;
    }

    const newSenderBalance = toDecimal(senderWallet.balance).minus(parsedAmount);
    const newRecipientBalance = toDecimal(recipientWallet.balance).plus(parsedAmount);

    await prisma.$transaction([
      walletModel.update({ userId }, { balance: newSenderBalance }),
      walletModel.update({ id: recipientWallet.id }, { balance: newRecipientBalance }),
      walletModel.createTransaction({
        walletId: senderWallet.id,
        userId,
        reference: buildReference(),
        type: "TRANSFER",
        amount: parsedAmount,
        status: "completed",
        description: note || "Sent transfer",
        source: senderWallet.accountNumber,
        destination: recipientWallet.accountNumber,
        metadata: { note, recipient: recipientWallet.accountNumber },
      }),
      walletModel.createTransaction({
        walletId: recipientWallet.id,
        userId: recipientWallet.userId,
        reference: buildReference(),
        type: "RECEIVE",
        amount: parsedAmount,
        status: "completed",
        description: note || "Received transfer",
        source: senderWallet.accountNumber,
        destination: recipientWallet.accountNumber,
        metadata: { note, sender: senderWallet.accountNumber },
      }),
    ]);

    return walletModel.findByUserId(userId);
  },

  initializePaystack: async (userId, email, amount) => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      const error = new Error("Amount must be a positive number");
      error.statusCode = 400;
      throw error;
    }
    return paystackService.initializePayment({
      amount: parsedAmount,
      email,
      userId,
      metadata: { purpose: "wallet_deposit", walletUserId: userId },
    });
  },

  processVerifiedPaystackCharge: async (data) => {
    if (!isWalletDeposit({ data })) return { handled: false };

    const reference = String(data?.reference || "").trim();
    if (!reference) {
      const error = new Error("Paystack wallet deposit is missing a reference");
      error.statusCode = 400;
      throw error;
    }

    const amountKobo = Number(data?.amount);
    if (!Number.isSafeInteger(amountKobo) || amountKobo <= 0) {
      const error = new Error("Paystack wallet deposit amount is invalid");
      error.statusCode = 400;
      throw error;
    }
    if (String(data?.currency || "NGN").toUpperCase() !== "NGN") {
      const error = new Error("Wallet deposits must be settled in NGN");
      error.statusCode = 409;
      throw error;
    }

    const userId = String(data?.metadata?.walletUserId || data?.metadata?.userId || "").trim();
    const user = await getUser(userId, data?.customer?.email);
    if (!user) {
      const error = new Error("Paystack wallet deposit user not found");
      error.statusCode = 404;
      throw error;
    }

    const amount = new Prisma.Decimal(amountKobo).dividedBy(100);
    const wallet = await ensureWallet(user.id, data?.customer?.email);

    return prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findUnique({ where: { reference } });
      if (existing) return { wallet: await tx.wallet.findUnique({ where: { id: wallet.id } }), transaction: existing, duplicate: true, handled: true };

      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: wallet.userId,
          reference,
          type: "DEPOSIT",
          amount,
          status: "completed",
          description: "Paystack wallet deposit",
          source: "Paystack",
          destination: wallet.accountNumber,
          metadata: data,
        },
      });
      const updatedWallet = await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: amount } } });
      return { wallet: updatedWallet, transaction, duplicate: false, handled: true };
    });
  },

  processTransferWebhook: async (data) => {
    const reference = String(data?.reference || "").trim();
    if (!reference) return { handled: false };

    const transaction = await prisma.transaction.findUnique({ where: { reference } });
    if (!transaction || transaction.type !== "WITHDRAW") return { handled: false };

    const providerStatus = String(data?.status || "").trim().toLowerCase();
    if (!["success", "failed", "reversed"].includes(providerStatus)) return { handled: false };

    const providerAmount = Number(data?.amount);
    const expectedAmount = toDecimal(transaction.amount).times(100).toNumber();
    if (!Number.isSafeInteger(providerAmount) || providerAmount !== expectedAmount) {
      const error = new Error("Paystack transfer amount does not match the wallet withdrawal");
      error.statusCode = 409;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      const current = await tx.transaction.findUnique({ where: { id: transaction.id } });
      if (!current) return { handled: false };
      const metadata = current.metadata && typeof current.metadata === "object" && !Array.isArray(current.metadata) ? current.metadata : {};

      if (providerStatus === "success") {
        if (current.status === "completed") return { handled: true, duplicate: true, status: "completed" };
        await tx.wallet.update({ where: { id: current.walletId }, data: { frozenBalance: { decrement: current.amount } } });
        await tx.transaction.update({
          where: { id: current.id },
          data: { status: "completed", metadata: mergeMetadata(metadata, { providerStatus: "success", transferId: data.id || null }) },
        });
        return { handled: true, duplicate: false, status: "completed" };
      }

      if (metadata.balanceRestored === true) return { handled: true, duplicate: true, status: "failed" };

      await tx.wallet.update({
        where: { id: current.walletId },
        data: { balance: { increment: current.amount }, frozenBalance: { decrement: current.amount } },
      });
      await tx.transaction.update({
        where: { id: current.id },
        data: {
          status: "failed",
          metadata: mergeMetadata(metadata, {
            providerStatus,
            transferId: data.id || null,
            balanceRestored: true,
            providerFailure: data.reason || data.failures || null,
          }),
        },
      });

      return { handled: true, duplicate: false, status: "failed" };
    });
  },
};
