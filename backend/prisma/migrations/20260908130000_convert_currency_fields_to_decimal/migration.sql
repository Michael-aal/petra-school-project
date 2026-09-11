DO $$
DECLARE
  field RECORD;
BEGIN
  FOR field IN
    SELECT * FROM (VALUES
      ('Wallet', 'balance'),
      ('Wallet', 'dailyTransactionLimit'),
      ('Wallet', 'frozenBalance'),
      ('Wallet', 'monthlyTransactionLimit'),
      ('Wallet', 'spendingLimit'),
      ('Transaction', 'amount'),
      ('FeeStructure', 'amount'),
      ('StudentFee', 'amount'),
      ('StudentFee', 'outstandingBalance'),
      ('Invoice', 'totalAmount'),
      ('Invoice', 'outstandingBalance'),
      ('InvoiceItem', 'unitPrice'),
      ('InvoiceItem', 'amount'),
      ('Payment', 'amount'),
      ('Scholarship', 'amount'),
      ('Fine', 'amount'),
      ('InstallmentPlan', 'totalAmount'),
      ('InstallmentPayment', 'amount'),
      ('Expense', 'amount')
    ) AS fields(table_name, column_name)
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = field.table_name
        AND column_name = field.column_name
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I ALTER COLUMN %I TYPE DECIMAL(12,2) USING ROUND(%I::numeric, 2)',
        field.table_name,
        field.column_name,
        field.column_name
      );
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Wallet' AND column_name = 'balance') THEN
    ALTER TABLE "Wallet" ALTER COLUMN "balance" SET DEFAULT 0.00;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Wallet' AND column_name = 'frozenBalance') THEN
    ALTER TABLE "Wallet" ALTER COLUMN "frozenBalance" SET DEFAULT 0.00;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'StudentFee' AND column_name = 'outstandingBalance') THEN
    ALTER TABLE "StudentFee" ALTER COLUMN "outstandingBalance" SET DEFAULT 0.00;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Invoice' AND column_name = 'outstandingBalance') THEN
    ALTER TABLE "Invoice" ALTER COLUMN "outstandingBalance" SET DEFAULT 0.00;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Scholarship' AND column_name = 'amount') THEN
    ALTER TABLE "Scholarship" ALTER COLUMN "amount" SET DEFAULT 0.00;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Fine' AND column_name = 'amount') THEN
    ALTER TABLE "Fine" ALTER COLUMN "amount" SET DEFAULT 0.00;
  END IF;
END $$;
