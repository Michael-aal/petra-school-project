-- Announcement metadata is applied here, but some historical migration paths
-- do not contain the original Announcement table creation. Restore the base
-- table only when it is missing so this migration remains safe on databases
-- that already have Announcement.
DO $$
BEGIN
  IF to_regclass('public."Announcement"') IS NULL THEN
    CREATE TABLE "Announcement" (
      "id" TEXT NOT NULL,
      "schoolId" INTEGER NOT NULL,
      "title" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

-- Add announcement metadata used by the announcement service.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'AnnouncementPriority'
      AND typnamespace = 'public'::regnamespace
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

-- Draft announcements are intentionally allowed to have no publication timestamp.
ALTER TABLE "Announcement"
  ALTER COLUMN "publishedAt" DROP NOT NULL;
