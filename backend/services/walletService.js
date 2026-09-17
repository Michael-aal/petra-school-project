import { prisma } from "../config/db.js";
import { Prisma } from "@prisma/client";
import { walletModel } from "../models/walletModel.js";
import { userModel } from "../models/userModel.js";
import { paystackService } from "./paystackService.js";
import { recordAuditMutation } from "../middleware/audit.js";

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

  withdraw: async (userId, amount, description) => {
    const parsedAmount = toDecimal(amount);
    if (parsedAmount.lte(0)) {
      const error = new Error("Withdrawal amount must be a positive number");
      error.statusCode = 400;
      throw error;
    }

    const updatedWallet = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet || toDecimal(wallet.balance).lt(parsedAmount)) {
        const error = new Error("Insufficient wallet balance");
        error.statusCode = 400;
        throw error;
      }
      await tx.$queryRaw`SELECT "id" FROM "Wallet" WHERE "id" = ${wallet.id} FOR UPDATE`;
      const locked = await tx.wallet.findUnique({ where: { id: wallet.id } });
      if (!locked || toDecimal(locked.balance).lt(parsedAmount)) {
        const error = new Error("Insufficient wallet balance");
        error.statusCode = 400;
        throw error;
      }
      const updated = await tx.wallet.update({ where: { id: locked.id }, data: { balance: toDecimal(locked.balance).minus(parsedAmount) } });
      await tx.transaction.create({ data: { walletId: locked.id, userId, reference: buildReference(), type: "WITHDRAW", amount: parsedAmount, status: "completed", description: description || "Wallet withdrawal", source: "Wallet", destination: "Bank transfer", metadata: { note: description || "withdrawal" } } });
      return updated;
    });
    await recordAuditMutation({ user: { id: userId }, entity: "Wallet", entityId: updatedWallet.id, action: "WITHDRAW", actionType: "WALLET", after: { amount: parsedAmount, description } });
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

    const updated = await prisma.$transaction(async (tx) => {
      // A consistent lock order prevents deadlocks for opposing transfers.
      const ids = [senderWallet.id, recipientWallet.id].sort();
      await tx.$queryRaw`SELECT "id" FROM "Wallet" WHERE "id" IN (${Prisma.join(ids)}) FOR UPDATE`;
      const [sender, recipientRecord] = await Promise.all([
        tx.wallet.findUnique({ where: { id: senderWallet.id } }),
        tx.wallet.findUnique({ where: { id: recipientWallet.id } }),
      ]);
      if (!sender || !recipientRecord || toDecimal(sender.balance).lt(parsedAmount)) {
        const error = new Error("Insufficient balance to transfer");
        error.statusCode = 400;
        throw error;
      }
      await tx.wallet.update({ where: { id: sender.id }, data: { balance: toDecimal(sender.balance).minus(parsedAmount) } });
      await tx.wallet.update({ where: { id: recipientRecord.id }, data: { balance: toDecimal(recipientRecord.balance).plus(parsedAmount) } });
      await tx.transaction.createMany({ data: [
        { walletId: sender.id, userId, reference: buildReference(), type: "TRANSFER", amount: parsedAmount, status: "completed", description: note || "Sent transfer", source: sender.accountNumber, destination: recipientRecord.accountNumber, metadata: { note, recipient: recipientRecord.accountNumber } },
        { walletId: recipientRecord.id, userId: recipientRecord.userId, reference: buildReference(), type: "RECEIVE", amount: parsedAmount, status: "completed", description: note || "Received transfer", source: sender.accountNumber, destination: recipientRecord.accountNumber, metadata: { note, sender: sender.accountNumber } },
      ] });
      return sender;
    });
    await recordAuditMutation({ user: { id: userId }, entity: "Wallet", entityId: senderWallet.id, action: "TRANSFER", actionType: "WALLET", after: { amount: parsedAmount, recipient: recipientWallet.id, note } });
    return updated;
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
