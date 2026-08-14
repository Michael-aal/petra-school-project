-- Add applicationCode and admissionCode columns to Admission if missing
ALTER TABLE "Admission" ADD COLUMN IF NOT EXISTS "applicationCode" TEXT;
ALTER TABLE "Admission" ADD COLUMN IF NOT EXISTS "admissionCode" TEXT;

-- Backfill applicationCode and admissionCode from submissionData JSON when present
UPDATE "Admission"
SET "applicationCode" = COALESCE(NULLIF(TRIM("submissionData"->>'applicationCode'), ''), "applicationCode")
WHERE jsonb_typeof("submissionData") = 'object'
  AND COALESCE("submissionData"->>'applicationCode', '') <> ''
  AND ("applicationCode" IS NULL OR "applicationCode" = '');

UPDATE "Admission"
SET "admissionCode" = COALESCE(NULLIF(TRIM("submissionData"->>'admissionCode'), ''), "admissionCode")
WHERE jsonb_typeof("submissionData") = 'object'
  AND COALESCE("submissionData"->>'admissionCode', '') <> ''
  AND ("admissionCode" IS NULL OR "admissionCode" = '');

-- Create unique indexes if not present
CREATE UNIQUE INDEX IF NOT EXISTS "Admission_applicationCode_key" ON "Admission"("applicationCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Admission_admissionCode_key" ON "Admission"("admissionCode");

-- Helpful index for listing/searching
CREATE INDEX IF NOT EXISTS "Admission_schoolId_status_idx" ON "Admission"("schoolId", "status");
