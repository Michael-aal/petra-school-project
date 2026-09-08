-- Align the User table with the current Prisma model.
-- These identity fields were present in schema.prisma but missing from the
-- migration history, causing Prisma P2022 errors during authentication.

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "firstName" TEXT,
  ADD COLUMN IF NOT EXISTS "middleName" TEXT,
  ADD COLUMN IF NOT EXISTS "lastName" TEXT,
  ADD COLUMN IF NOT EXISTS "username" TEXT,
  ADD COLUMN IF NOT EXISTS "roleId" TEXT;

UPDATE "User"
SET
  "firstName" = COALESCE(NULLIF("firstName", ''), split_part(trim("fullName"), ' ', 1)),
  "lastName" = COALESCE(
    NULLIF("lastName", ''),
    CASE
      WHEN position(' ' IN trim("fullName")) > 0 THEN reverse(split_part(reverse(trim("fullName")), ' ', 1))
      ELSE split_part(trim("fullName"), ' ', 1)
    END
  ),
  "username" = COALESCE(
    NULLIF("username", ''),
    NULLIF(lower(regexp_replace(split_part("email", '@', 1), '[^a-zA-Z0-9._-]', '', 'g')), '')
  )
WHERE "firstName" IS NULL
   OR "lastName" IS NULL
   OR "username" IS NULL;

UPDATE "User" AS u
SET "username" = COALESCE(NULLIF(u."username", ''), 'user_' || left(md5(u."id"), 12))
WHERE u."username" IS NULL OR u."username" = '';

WITH duplicates AS (
  SELECT "id", "username",
         row_number() OVER (PARTITION BY "username" ORDER BY "id") AS duplicate_number
  FROM "User"
)
UPDATE "User" AS u
SET "username" = u."username" || '_' || left(md5(u."id"), 8)
FROM duplicates AS d
WHERE u."id" = d."id" AND d.duplicate_number > 1;

ALTER TABLE "User"
  ALTER COLUMN "firstName" SET NOT NULL,
  ALTER COLUMN "lastName" SET NOT NULL,
  ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE INDEX IF NOT EXISTS "User_username_idx" ON "User"("username");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'User_roleId_fkey'
  ) THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_roleId_fkey"
      FOREIGN KEY ("roleId") REFERENCES "Role"("id")
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;
