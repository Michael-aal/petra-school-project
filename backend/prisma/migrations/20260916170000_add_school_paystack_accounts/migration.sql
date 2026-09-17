CREATE TABLE "SchoolPaymentAccount" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "paystackCustomerId" BIGINT,
  "paystackCustomerCode" TEXT,
  "paystackSubaccountCode" TEXT,
  "paystackSubaccountId" BIGINT,
  "dvaId" BIGINT,
  "dvaAccountNumber" TEXT,
  "dvaAccountName" TEXT,
  "dvaBankName" TEXT,
  "dvaBankCode" TEXT,
  "dvaProviderSlug" TEXT,
  "settlementBankCode" TEXT,
  "settlementBankName" TEXT,
  "settlementAccountNumber" TEXT,
  "settlementAccountName" TEXT,
  "settlementSchedule" TEXT NOT NULL DEFAULT 'auto',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SchoolPaymentAccount_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SchoolPaymentAccount_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SchoolPaymentAccount_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SchoolPaymentAccount_schoolId_key" ON "SchoolPaymentAccount"("schoolId");
CREATE UNIQUE INDEX "SchoolPaymentAccount_ownerUserId_key" ON "SchoolPaymentAccount"("ownerUserId");
CREATE UNIQUE INDEX "SchoolPaymentAccount_paystackCustomerCode_key" ON "SchoolPaymentAccount"("paystackCustomerCode");
CREATE UNIQUE INDEX "SchoolPaymentAccount_paystackSubaccountCode_key" ON "SchoolPaymentAccount"("paystackSubaccountCode");
CREATE UNIQUE INDEX "SchoolPaymentAccount_dvaAccountNumber_key" ON "SchoolPaymentAccount"("dvaAccountNumber");
CREATE INDEX "SchoolPaymentAccount_schoolId_status_idx" ON "SchoolPaymentAccount"("schoolId", "status");
