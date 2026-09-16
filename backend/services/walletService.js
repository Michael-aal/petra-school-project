import { prisma } from "../config/db.js";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { walletModel } from "../models/walletModel.js";
import { userModel } from "../models/userModel.js";
import { paystackService } from "./paystackService.js";

const generateAccountNumber = () => Math.floor(1000000000 + Math.random() * 9000000000).toString();

const buildReference = () => `wallet_tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const toDecimal = (value) => value instanceof Prisma.Decimal ? value : new Prisma.Decimal(String(value ?? 0));

const getUser = async (userId, email) => {
  if (userId) {
    const user = await userModel.findById(userId);
    if (user) return user;
  }

  if (email) {
    return userModel.findByEmail(email);
  }

  return null;
};

const createWallet = async (userId, email) => {
  const user = await getUser(userId, email);
  const accountName = user?.fullName || email || "Petra School Wallet";

  return walletModel.create({
    userId,
    accountNumber: generateAccountNumber(),
    accountName,
    bankName: "Petra Bank",
    bankCode: "101",
    currency: "NGN",
    balance: new Prisma.Decimal(0),
  });
};

const ensureWallet = async (userId, email) => {
  let wallet = await walletModel.findByUserId(userId);
  if (!wallet) {
    wallet = await createWallet(userId, email);
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

  getTransactions: async (userId, startDate, endDate) => {
    return walletModel.findTransactions({ userId, startDate, endDate });
  },

  setWithdrawalPin: async (userId, pin) => {
    const normalizedPin = validateWithdrawalPin(pin);
    const wallet = await ensureWallet(userId);
    const currentPreferences = wallet.notificationPreferences && typeof wallet.notificationPreferences === "object" && !Array.isArray(wallet.notificationPreferences)
      ? wallet.notificationPreferences
      : {};

    const withdrawalPinHash = await bcrypt.hash(normalizedPin, 12);
    const updatedWallet = await walletModel.update(
      { id: wallet.id },
      {
        notificationPreferences: {
          ...currentPreferences,
          withdrawalPinHash,
        },
      },
    );

    return {
      configured: Boolean(getWithdrawalPinHash(updatedWallet)),
    };
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

    const existingTransaction = await prisma.transaction.findUnique({
      where: { idempotencyKey: normalizedIdempotencyKey },
    });
    if (existingTransaction) {
      if (existingTransaction.userId !== userId || existingTransaction.type !== "WITHDRAW") {
        const error = new Error("This idempotency key is already used by another transaction");
        error.statusCode = 409;
        throw error;
      }
      return {
        transaction: existingTransaction,
        wallet: await walletModel.findByUserId(userId),
        duplicate: true,
      };
    }

    const wallet = await ensureWallet(userId);
    const pinHash = getWithdrawalPinHash(wallet);
    if (!pinHash) {
      const error = new Error("Withdrawal PIN is not configured. Set your withdrawal PIN first.");
      error.statusCode = 403;
      throw error;
    }

    const pinMatches = await bcrypt.compare(normalizedPin, pinHash);
    if (!pinMatches) {
      const error = new Error("Incorrect withdrawal PIN");
      error.statusCode = 401;
      throw error;
    }

    if (!accountNumber || !/^\d{8,20}$/.test(String(accountNumber))) {
      const error = new Error("A valid destination account number is required");
      error.statusCode = 400;
      throw error;
    }

    if (!bankCode) {
      const error = new Error("Destination bank code is required");
      error.statusCode = 400;
      throw error;
    }

    const reference = buildReference();

    try {
      const result = await prisma.$transaction(async (tx) => {
        const currentWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });
        if (!currentWallet) {
          const error = new Error("Wallet not found");
          error.statusCode = 404;
          throw error;
        }

        const updated = await tx.wallet.updateMany({
          where: {
            id: currentWallet.id,
            balance: { gte: parsedAmount },
          },
          data: {
            balance: { decrement: parsedAmount },
          },
        });

        if (updated.count !== 1) {
          const error = new Error("Insufficient wallet balance");
          error.statusCode = 400;
          throw error;
        }

        const transaction = await tx.transaction.create({
          data: {
            walletId: currentWallet.id,
            userId,
            idempotencyKey: normalizedIdempotencyKey,
            reference,
            type: "WITHDRAW",
            amount: parsedAmount,
            status: "pending",
            description: description || "Wallet withdrawal",
            source: currentWallet.accountNumber,
            destination: "Bank transfer",
            metadata: {
              bankCode: String(bankCode),
              bankName: bankName || null,
              accountNumber: String(accountNumber),
              accountName: accountName || null,
              providerStatus: "NOT_SUBMITTED",
              security: "petra_withdrawal_pin",
            },
          },
        });

        return {
          transaction,
          wallet: await tx.wallet.findUnique({ where: { id: currentWallet.id } }),
        };
      });

      return { ...result, duplicate: false };
    } catch (error) {
      if (error?.code === "P2002") {
        const duplicate = await prisma.transaction.findUnique({
          where: { idempotencyKey: normalizedIdempotencyKey },
        });
        if (duplicate && duplicate.userId === userId && duplicate.type === "WITHDRAW") {
          return {
            transaction: duplicate,
            wallet: await walletModel.findByUserId(userId),
            duplicate: true,
          };
        }
      }
      throw error;
    }
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
    return paystackService.initializePayment({ amount, email, userId });
  },

  processPaystackWebhook: async (rawBody, signatureHeader) => {
    const payload = paystackService.parseWebhookPayload(rawBody, signatureHeader);

    if (payload?.event !== "charge.success") {
      return payload;
    }

    const data = payload.data;
    const reference = data.reference;
    if (!reference) {
      const error = new Error("Paystack webhook payload missing reference");
      error.statusCode = 400;
      throw error;
    }

    const existingTransaction = await walletModel.findTransactionByReference(reference);
    if (existingTransaction) {
      return payload;
    }

    const amount = new Prisma.Decimal(String(data.amount || 0)).dividedBy(100);
    const customerEmail = data.customer?.email;
    const user = await getUser(data.metadata?.userId, customerEmail);
    if (!user) {
      const error = new Error("Paystack webhook user not found");
      error.statusCode = 404;
      throw error;
    }

    const wallet = await ensureWallet(user.id, customerEmail);
    const updatedWallet = await walletModel.update({ userId: wallet.userId }, { balance: toDecimal(wallet.balance).plus(amount) });

    await walletModel.createTransaction({
      walletId: wallet.id,
      userId: wallet.userId,
      reference,
      type: "DEPOSIT",
      amount,
      status: "completed",
      description: "Paystack deposit",
      source: "Paystack",
      destination: wallet.accountNumber,
      metadata: data,
    });

    return { wallet: updatedWallet, event: payload.event };
  },
};
