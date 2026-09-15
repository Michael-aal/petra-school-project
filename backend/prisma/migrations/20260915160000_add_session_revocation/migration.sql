ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Session_userId_revokedAt_expiresAt_idx"
  ON "Session" ("userId", "revokedAt", "expiresAt");