-- Restore the AuditLog.severity column expected by the Prisma schema.
-- Additive and safe for existing audit records.
ALTER TABLE "AuditLog"
ADD COLUMN IF NOT EXISTS "severity" TEXT DEFAULT 'INFO';

UPDATE "AuditLog"
SET "severity" = 'INFO'
WHERE "severity" IS NULL;
