import { prisma } from "../config/db.js";
import { walletModel } from "../models/walletModel.js";
import { userModel } from "../models/userModel.js";
import { paystackService } from "./paystackService.js";

const generateAccountNumber = () => Math.floor(1000000000 + Math.random() * 9000000000).toString();

const buildReference = () => `wallet_tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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
    balance: 0.0,
  });
};

const ensureWallet = async (userId, email) => {
  let wallet = await walletModel.findByUserId(userId);
  if (!wallet) {
    wallet = await createWallet(userId, email);
  }
  return wallet;
};

const buildTransactionMeta = ({ reference, amount, type, description, source, destination, metadata }) => ({
  walletId: metadata.walletId,
  userId: metadata.userId,
  reference,
  type,
  amount,
  status: "completed",
  description,
  source,
  destination,
  metadata,
});

export const walletService = {
  getWalletSummary: async (userId, email) => {
    const wallet = await ensureWallet(userId, email);
    const transactions = await walletModel.findRecentTransactions(userId, 8);

    const totals = transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === "DEPOSIT") acc.deposits += transaction.amount;
        if (transaction.type === "WITHDRAW") acc.withdrawals += transaction.amount;
        if (transaction.type === "TRANSFER") acc.transfers += transaction.amount;
        return acc;
      },
      { deposits: 0, withdrawals: 0, transfers: 0 },
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

  withdraw: async (userId, amount, description) => {
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      const error = new Error("Withdrawal amount must be a positive number");
      error.statusCode = 400;
      throw error;
    }

    const wallet = await ensureWallet(userId);
    if (wallet.balance < parsedAmount) {
      const error = new Error("Insufficient wallet balance");
      error.statusCode = 400;
      throw error;
    }

    const newBalance = wallet.balance - parsedAmount;

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
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      const error = new Error("Transfer amount must be a positive number");
      error.statusCode = 400;
      throw error;
    }

    const senderWallet = await ensureWallet(userId);
    if (senderWallet.balance < parsedAmount) {
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

    const newSenderBalance = senderWallet.balance - parsedAmount;
    const newRecipientBalance = recipientWallet.balance + parsedAmount;

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

    const amount = Number(data.amount) / 100;
    const customerEmail = data.customer?.email;
    const user = await getUser(data.metadata?.userId, customerEmail);
    if (!user) {
      const error = new Error("Paystack webhook user not found");
      error.statusCode = 404;
      throw error;
    }

    const wallet = await ensureWallet(user.id, customerEmail);
    const updatedWallet = await walletModel.update({ userId: wallet.userId }, { balance: wallet.balance + amount });

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
