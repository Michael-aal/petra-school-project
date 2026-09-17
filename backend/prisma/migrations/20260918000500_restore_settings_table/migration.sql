-- Restore the Settings table required by the current Prisma schema and finance/wallet services.
-- This is additive and safe for existing production data.

CREATE TABLE IF NOT EXISTS "Settings" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Settings_schoolId_key_key"
  ON "Settings" ("schoolId", "key");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Settings_schoolId_fkey'
      AND conrelid = '"Settings"'::regclass
  ) THEN
    ALTER TABLE "Settings"
      ADD CONSTRAINT "Settings_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
