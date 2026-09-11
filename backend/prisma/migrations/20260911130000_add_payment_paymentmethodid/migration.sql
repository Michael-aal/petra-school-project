-- Align the Payment table with the existing optional PaymentMethod relation.
ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "paymentMethodId" TEXT;

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_paymentMethodId_fkey"
  FOREIGN KEY ("paymentMethodId")
  REFERENCES "PaymentMethod"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
