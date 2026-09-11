-- Add applicantId column to Admission to store persistent applicant identifier
ALTER TABLE IF EXISTS "Admission" ADD COLUMN IF NOT EXISTS "applicantId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Admission_applicantId_key" ON "Admission"("applicantId");

-- Backfill: for existing admissions that lack an applicantId, we will not generate one automatically here.
-- Application code generation is handled by the application layer during new admissions.
