-- Align the existing Assessment table with the nullable subject relation in the Prisma schema.
ALTER TABLE IF EXISTS "Assessment"
  ADD COLUMN IF NOT EXISTS "subjectId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Assessment_subjectId_fkey'
  ) THEN
    ALTER TABLE "Assessment"
      ADD CONSTRAINT "Assessment_subjectId_fkey"
      FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;
