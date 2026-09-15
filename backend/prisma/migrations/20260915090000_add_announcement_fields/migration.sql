-- Add announcement metadata used by the announcement service.
CREATE TYPE "AnnouncementPriority" AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT');

ALTER TABLE "Announcement"
  ADD COLUMN "priority" "AnnouncementPriority" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN "audience" TEXT NOT NULL DEFAULT 'TEACHERS_AND_PARENTS',
  ADD COLUMN "isDraft" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "publishAt" TIMESTAMP(3),
  ADD COLUMN "expiryAt" TIMESTAMP(3);

-- Draft announcements are intentionally allowed to have no publication timestamp.
ALTER TABLE "Announcement"
  ALTER COLUMN "publishedAt" DROP NOT NULL;
