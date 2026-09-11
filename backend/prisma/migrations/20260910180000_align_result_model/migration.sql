-- Align the legacy Result table with the current Prisma Result model.
-- The live Result table is empty, so the required schoolId can be added
-- without a legacy-row backfill. ExamAttempt and ExamResult remain canonical.

ALTER TABLE "Result"
  ADD COLUMN IF NOT EXISTS "schoolId" INTEGER NOT NULL;

ALTER TABLE "Result"
  ADD COLUMN IF NOT EXISTS "subjectId" TEXT;

ALTER TABLE "Result"
  DROP CONSTRAINT IF EXISTS "Result_teacherId_fkey";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Result_teacherId_fkey'
  ) THEN
    ALTER TABLE "Result"
      ADD CONSTRAINT "Result_teacherId_fkey"
      FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Result_schoolId_fkey'
  ) THEN
    ALTER TABLE "Result"
      ADD CONSTRAINT "Result_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Result_subjectId_fkey'
  ) THEN
    ALTER TABLE "Result"
      ADD CONSTRAINT "Result_subjectId_fkey"
      FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
      ON DELETE NO ACTION ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Result_schoolId_studentId_idx"
  ON "Result"("schoolId", "studentId");
