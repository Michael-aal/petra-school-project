ALTER TABLE "FeeStructure"
ADD COLUMN IF NOT EXISTS "quantityRequired" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "PaymentLine" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "feeStructureId" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitAmount" DECIMAL(12,2) NOT NULL,
  "lineTotal" DECIMAL(12,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PaymentLine_paymentId_idx" ON "PaymentLine"("paymentId");
CREATE INDEX IF NOT EXISTS "PaymentLine_feeStructureId_idx" ON "PaymentLine"("feeStructureId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PaymentLine_paymentId_fkey'
  ) THEN
    ALTER TABLE "PaymentLine"
      ADD CONSTRAINT "PaymentLine_paymentId_fkey"
      FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PaymentLine_feeStructureId_fkey'
  ) THEN
    ALTER TABLE "PaymentLine"
      ADD CONSTRAINT "PaymentLine_feeStructureId_fkey"
      FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;