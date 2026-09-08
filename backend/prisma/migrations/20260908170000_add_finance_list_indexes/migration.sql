CREATE INDEX IF NOT EXISTS "Invoice_schoolId_createdAt_idx"
  ON "Invoice"("schoolId", "createdAt");

CREATE INDEX IF NOT EXISTS "InstallmentPlan_schoolId_createdAt_idx"
  ON "InstallmentPlan"("schoolId", "createdAt");