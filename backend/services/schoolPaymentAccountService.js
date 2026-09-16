import crypto from "crypto";
import { prisma } from "../config/db.js";
import { paystackService } from "./paystackService.js";
import { isPaystackTestMode, shouldProvisionSettlementSubaccount } from "../utils/paystackProvisioningMode.js";

const requireSchool = (user) => {
  const schoolId = Number(user?.schoolId);
  if (!Number.isInteger(schoolId) || schoolId <= 0) {
    const error = new Error("School context missing");
    error.statusCode = 403;
    throw error;
  }
  return schoolId;
};

const mapAccount = (row) => row ? ({
  id: row.id,
  schoolId: Number(row.schoolId),
  ownerUserId: row.ownerUserId,
  status: row.status,
  paystackCustomerCode: row.paystackCustomerCode,
  paystackSubaccountCode: row.paystackSubaccountCode,
  testMode: row.dvaProviderSlug === "test-bank" || !row.paystackSubaccountCode,
  dva: row.dvaAccountNumber ? {
    id: row.dvaId,
    accountNumber: row.dvaAccountNumber,
    accountName: row.dvaAccountName,
    bankName: row.dvaBankName,
    bankCode: row.dvaBankCode,
    providerSlug: row.dvaProviderSlug,
  } : null,
  settlement: row.settlementAccountNumber ? {
    accountNumber: row.settlementAccountNumber,
    accountName: row.settlementAccountName,
    bankName: row.settlementBankName,
    bankCode: row.settlementBankCode,
    schedule: row.settlementSchedule,
  } : null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
}) : null;

const getAccount = async (schoolId) => {
  const rows = await prisma.$queryRaw`
    SELECT * FROM "SchoolPaymentAccount" WHERE "schoolId" = ${schoolId} LIMIT 1
  `;
  return rows[0] || null;
};

const ensurePrincipal = (user) => {
  const role = String(user?.role || "").toLowerCase();
  if (!["principal", "super_admin"].includes(role)) {
    const error = new Error("Only a principal or super admin can manage the school payment account");
    error.statusCode = 403;
    throw error;
  }
};

export const schoolPaymentAccountService = {
  get: async (user) => {
    const schoolId = requireSchool(user);
    return mapAccount(await getAccount(schoolId));
  },

  setup: async (user, payload = {}) => {
    ensurePrincipal(user);
    const schoolId = requireSchool(user);

    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      const error = new Error("School not found");
      error.statusCode = 404;
      throw error;
    }

    const existing = await getAccount(schoolId);
    const sandbox = isPaystackTestMode();
    const hasUsableExistingAccount = existing?.status === "active"
      && existing?.dvaAccountNumber
      && existing?.paystackCustomerCode
      && (sandbox || existing?.paystackSubaccountCode);
    if (hasUsableExistingAccount) {
      return mapAccount(existing);
    }

    const bankCode = String(payload.bankCode || "").trim();
    const accountNumber = String(payload.accountNumber || "").trim();
    if (!/^\d{10}$/.test(accountNumber) || !/^\d+$/.test(bankCode)) {
      const error = new Error("A valid 10-digit settlement bank account number and bank code are required");
      error.statusCode = 400;
      throw error;
    }

    const contactName = String(payload.contactName || user.fullName || school.name).trim();
    const contactEmail = String(payload.contactEmail || user.email || school.email || "").trim();
    const contactPhone = String(payload.contactPhone || user.phone || school.phone || "").trim();
    const percentageCharge = Number.isFinite(Number(process.env.PAYSTACK_SCHOOL_PERCENTAGE_CHARGE))
      ? Number(process.env.PAYSTACK_SCHOOL_PERCENTAGE_CHARGE)
      : 0;

    if (percentageCharge < 0 || percentageCharge > 100) {
      const error = new Error("PAYSTACK_SCHOOL_PERCENTAGE_CHARGE must be between 0 and 100");
      error.statusCode = 500;
      throw error;
    }

    // Paystack's current test-mode documentation does not provide a stable
    // subaccount settlement credential. Test mode can still exercise the
    // customer + dedicated virtual account flow, while real settlement
    // subaccount creation is reserved for live mode where the school's real
    // settlement account is verified by Paystack.
    const subaccount = shouldProvisionSettlementSubaccount()
      ? await paystackService.createSubaccount({
        businessName: school.name,
        bankCode,
        accountNumber,
        percentageCharge,
        description: `Petra school account for school ${schoolId}`,
        primaryContactEmail: contactEmail || undefined,
        primaryContactName: contactName || undefined,
        primaryContactPhone: contactPhone || undefined,
        metadata: { schoolId: String(schoolId), product: "petra-school-payments" },
      })
      : null;

    const customer = await paystackService.createCustomer({
      email: contactEmail || user.email,
      firstName: user.firstName || contactName.split(" ")[0] || "School",
      lastName: user.lastName || contactName.split(" ").slice(1).join(" ") || "Admin",
      phone: contactPhone || undefined,
      metadata: { schoolId: String(schoolId), product: "petra-school-payments" },
    });

    const preferredBank = process.env.PAYSTACK_DVA_PROVIDER
      || (sandbox ? "test-bank" : "titan-paystack");

    const dva = await paystackService.createDedicatedVirtualAccount({
      customer: customer.customer_code,
      preferredBank,
      ...(subaccount?.subaccount_code ? { subaccount: subaccount.subaccount_code } : {}),
    });

    const id = existing?.id || crypto.randomUUID();
    const settlementAccountName = subaccount?.account_name || null;
    const settlementBankName = subaccount?.settlement_bank || null;
    const settlementSchedule = subaccount?.settlement_schedule || "AUTO";

    const rows = await prisma.$queryRaw`
      INSERT INTO "SchoolPaymentAccount" (
        "id", "schoolId", "ownerUserId", "status", "paystackCustomerId", "paystackCustomerCode",
        "paystackSubaccountCode", "paystackSubaccountId", "dvaId", "dvaAccountNumber", "dvaAccountName",
        "dvaBankName", "dvaBankCode", "dvaProviderSlug", "settlementBankCode", "settlementBankName",
        "settlementAccountNumber", "settlementAccountName", "settlementSchedule"
      ) VALUES (
        ${id}, ${schoolId}, ${user.id}, 'active', ${customer.id}, ${customer.customer_code},
        ${subaccount?.subaccount_code || null}, ${subaccount?.id || null}, ${dva.id}, ${dva.account_number}, ${dva.account_name},
        ${dva.bank?.name || null}, ${dva.bank?.id ? String(dva.bank.id) : preferredBank}, ${dva.bank?.slug || preferredBank},
        ${bankCode}, ${settlementBankName}, ${accountNumber},
        ${settlementAccountName}, ${settlementSchedule}
      )
      ON CONFLICT ("schoolId") DO UPDATE SET
        "ownerUserId" = EXCLUDED."ownerUserId",
        "status" = EXCLUDED."status",
        "paystackCustomerId" = EXCLUDED."paystackCustomerId",
        "paystackCustomerCode" = EXCLUDED."paystackCustomerCode",
        "paystackSubaccountCode" = EXCLUDED."paystackSubaccountCode",
        "paystackSubaccountId" = EXCLUDED."paystackSubaccountId",
        "dvaId" = EXCLUDED."dvaId",
        "dvaAccountNumber" = EXCLUDED."dvaAccountNumber",
        "dvaAccountName" = EXCLUDED."dvaAccountName",
        "dvaBankName" = EXCLUDED."dvaBankName",
        "dvaBankCode" = EXCLUDED."dvaBankCode",
        "dvaProviderSlug" = EXCLUDED."dvaProviderSlug",
        "settlementBankCode" = EXCLUDED."settlementBankCode",
        "settlementBankName" = EXCLUDED."settlementBankName",
        "settlementAccountNumber" = EXCLUDED."settlementAccountNumber",
        "settlementAccountName" = EXCLUDED."settlementAccountName",
        "settlementSchedule" = EXCLUDED."settlementSchedule",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING *
    `;

    return mapAccount(rows[0]);
  },
};
