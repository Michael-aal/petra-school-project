-- Align the Payment table with the existing optional PaymentMethod relation.
-- The column may already exist because the earlier schema migration introduced it.
ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "paymentMethodId" TEXT;

-- The foreign key may also already exist. Add it only when missing so this
-- migration is safe after partial migration/recovery states.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Payment_paymentMethodId_fkey'
      AND conrelid = 'Payment'::regclass
  ) THEN
    ALTER TABLE "Payment"
      ADD CONSTRAINT "Payment_paymentMethodId_fkey"
      FOREIGN KEY ("paymentMethodId")
      REFERENCES "PaymentMethod"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;
