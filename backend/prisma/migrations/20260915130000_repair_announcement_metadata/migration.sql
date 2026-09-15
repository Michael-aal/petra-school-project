-- Repair migration for announcement metadata.
-- The original announcement metadata migration can be marked applied while
-- the physical database table is missing some/all of the added columns.
-- This migration is intentionally idempotent so it repairs that drift
-- without dropping or recreating the Announcement table.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'AnnouncementPriority'
  ) THEN
    CREATE TYPE "AnnouncementPriority" AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT');
  END IF;
END $$;

ALTER TABLE "Announcement"
  ADD COLUMN IF NOT EXISTS "priority" "AnnouncementPriority" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS "audience" TEXT NOT NULL DEFAULT 'TEACHERS_AND_PARENTS',
  ADD COLUMN IF NOT EXISTS "isDraft" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "publishAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "expiryAt" TIMESTAMP(3);

ALTER TABLE "Announcement"
  ALTER COLUMN "publishedAt" DROP NOT NULL;
