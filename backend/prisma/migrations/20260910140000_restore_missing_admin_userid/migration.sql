-- Restore the missing optional Admin.userId field and relation that schema.prisma
-- already expects, without touching the User/Admin tables themselves.

ALTER TABLE IF EXISTS "Admin"
  ADD COLUMN IF NOT EXISTS "userId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Admin_userId_key"
  ON "Admin"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Admin_userId_fkey'
  ) THEN
    ALTER TABLE "Admin"
      ADD CONSTRAINT "Admin_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
