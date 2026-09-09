-- Restore the Principal profile table required by principal registration.
CREATE TABLE IF NOT EXISTS "Principal" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "schoolId" INTEGER NOT NULL,
  "designation" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Principal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Principal_userId_key"
  ON "Principal"("userId");

CREATE INDEX IF NOT EXISTS "Principal_schoolId_isActive_idx"
  ON "Principal"("schoolId", "isActive");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Principal_schoolId_fkey') THEN
    ALTER TABLE "Principal"
      ADD CONSTRAINT "Principal_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Principal_userId_fkey') THEN
    ALTER TABLE "Principal"
      ADD CONSTRAINT "Principal_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
