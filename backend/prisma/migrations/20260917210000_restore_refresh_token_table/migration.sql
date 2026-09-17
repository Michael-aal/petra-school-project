-- The historical 20260911070535 migration is intentionally skipped by
-- deployMigrations.js because it contains incompatible schema changes.
-- That migration also contained the RefreshToken table, so production
-- databases that never had that table fail during login.
-- Restore only the auth table required by the current Prisma schema.

CREATE TABLE IF NOT EXISTS "RefreshToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RefreshToken_token_key"
  ON "RefreshToken" ("token");

CREATE INDEX IF NOT EXISTS "RefreshToken_userId_expiresAt_idx"
  ON "RefreshToken" ("userId", "expiresAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'RefreshToken_userId_fkey'
      AND conrelid = '"RefreshToken"'::regclass
  ) THEN
    ALTER TABLE "RefreshToken"
      ADD CONSTRAINT "RefreshToken_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
