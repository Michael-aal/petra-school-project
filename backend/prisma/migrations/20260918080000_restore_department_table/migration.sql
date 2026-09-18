-- Restore the Department table required by the authoritative Prisma schema.
-- The historical migration that originally created this table is intentionally
-- skipped in production, so this additive migration restores only the missing table.

CREATE TABLE IF NOT EXISTS "Department" (
    "id" TEXT NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Department_schoolId_name_idx"
    ON "Department"("schoolId", "name");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Department_schoolId_fkey'
  ) THEN
    ALTER TABLE "Department"
      ADD CONSTRAINT "Department_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
