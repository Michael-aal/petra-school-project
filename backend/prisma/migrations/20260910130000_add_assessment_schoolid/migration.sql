-- Add the missing Assessment.schoolId column in the installed Postgres DB
-- and backfill it from the assessment owner teacher's linked User.schoolId.

ALTER TABLE IF EXISTS "Assessment"
  ADD COLUMN IF NOT EXISTS "schoolId" INTEGER;

UPDATE "Assessment" a
SET "schoolId" = u."schoolId"
FROM "User" u
WHERE a."teacherId" = u."id"
  AND a."schoolId" IS NULL
  AND u."schoolId" IS NOT NULL;

-- Keep legacy orphaned rows from becoming impossible to route.
UPDATE "Assessment"
SET "schoolId" = 1
WHERE "schoolId" IS NULL;

-- Ensure the relation exists in PostgreSQL metadata and stays idempotent.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Assessment_schoolId_fkey'
  ) THEN
    ALTER TABLE "Assessment"
      ADD CONSTRAINT "Assessment_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Assessment_schoolId_date_idx"
  ON "Assessment"("schoolId", "date");
