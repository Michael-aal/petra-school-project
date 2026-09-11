CREATE TABLE IF NOT EXISTS "FeeCategory" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeeCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FeeStructure" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "feeCategoryId" TEXT,
  "className" TEXT,
  "session" TEXT,
  "term" TEXT,
  "amount" DOUBLE PRECISION NOT NULL,
  "dueDate" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StudentFee" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "studentId" TEXT NOT NULL,
  "feeStructureId" TEXT,
  "amount" DOUBLE PRECISION NOT NULL,
  "outstandingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'Unpaid',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentFee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "studentId" TEXT NOT NULL,
  "invoiceNumber" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Unpaid',
  "dueDate" TIMESTAMP(3),
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "outstandingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InvoiceItem" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "studentId" TEXT NOT NULL,
  "invoiceId" TEXT,
  "method" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "paidAt" TIMESTAMP(3) NOT NULL,
  "reference" TEXT NOT NULL,
  "note" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Receipt" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "paymentId" TEXT NOT NULL,
  "receiptNumber" TEXT NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InstallmentPlan" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "studentId" TEXT NOT NULL,
  "session" TEXT,
  "term" TEXT,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "installments" INTEGER NOT NULL DEFAULT 1,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'Active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InstallmentPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InstallmentPayment" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "paidAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "reference" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InstallmentPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExpenseCategory" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Expense" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "expenseCategoryId" TEXT,
  "title" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FeeStructure_feeCategoryId_className_session_term_key" ON "FeeStructure"("feeCategoryId", "className", "session", "term");
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "InvoiceItem_invoiceId_description_key" ON "InvoiceItem"("invoiceId", "description");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_reference_key" ON "Payment"("reference");
CREATE UNIQUE INDEX IF NOT EXISTS "Receipt_paymentId_key" ON "Receipt"("paymentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "InstallmentPayment_reference_key" ON "InstallmentPayment"("reference");

CREATE INDEX IF NOT EXISTS "FeeCategory_schoolId_name_idx" ON "FeeCategory"("schoolId", "name");
CREATE INDEX IF NOT EXISTS "FeeStructure_schoolId_className_idx" ON "FeeStructure"("schoolId", "className");
CREATE INDEX IF NOT EXISTS "StudentFee_schoolId_studentId_idx" ON "StudentFee"("schoolId", "studentId");
CREATE INDEX IF NOT EXISTS "Invoice_schoolId_studentId_idx" ON "Invoice"("schoolId", "studentId");
CREATE INDEX IF NOT EXISTS "Payment_schoolId_status_idx" ON "Payment"("schoolId", "status");
CREATE INDEX IF NOT EXISTS "Payment_schoolId_paidAt_idx" ON "Payment"("schoolId", "paidAt");
CREATE INDEX IF NOT EXISTS "ExpenseCategory_schoolId_name_idx" ON "ExpenseCategory"("schoolId", "name");
CREATE INDEX IF NOT EXISTS "Expense_schoolId_occurredAt_idx" ON "Expense"("schoolId", "occurredAt");

ALTER TABLE IF EXISTS "FeeCategory" ADD CONSTRAINT "FeeCategory_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "FeeStructure" ADD CONSTRAINT "FeeStructure_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "FeeStructure" ADD CONSTRAINT "FeeStructure_feeCategoryId_fkey" FOREIGN KEY ("feeCategoryId") REFERENCES "FeeCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "StudentFee" ADD CONSTRAINT "StudentFee_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "StudentFee" ADD CONSTRAINT "StudentFee_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "StudentFee" ADD CONSTRAINT "StudentFee_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "Invoice" ADD CONSTRAINT "Invoice_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "Invoice" ADD CONSTRAINT "Invoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "Payment" ADD CONSTRAINT "Payment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "Payment" ADD CONSTRAINT "Payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "Receipt" ADD CONSTRAINT "Receipt_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "Receipt" ADD CONSTRAINT "Receipt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "InstallmentPlan" ADD CONSTRAINT "InstallmentPlan_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "InstallmentPlan" ADD CONSTRAINT "InstallmentPlan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "InstallmentPayment" ADD CONSTRAINT "InstallmentPayment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "InstallmentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "Expense" ADD CONSTRAINT "Expense_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "Expense" ADD CONSTRAINT "Expense_expenseCategoryId_fkey" FOREIGN KEY ("expenseCategoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
