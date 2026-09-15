-- Add the per-user announcement delivery/read/reaction table used by the
-- announcement service. This migration is intentionally idempotent so it can
-- repair databases where the service was deployed before this table existed.

CREATE TABLE IF NOT EXISTS "AnnouncementRecipient" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "reaction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementRecipient_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AnnouncementRecipient_announcementId_userId_key" UNIQUE ("announcementId", "userId")
);

CREATE INDEX IF NOT EXISTS "AnnouncementRecipient_schoolId_userId_idx"
  ON "AnnouncementRecipient" ("schoolId", "userId");

CREATE INDEX IF NOT EXISTS "AnnouncementRecipient_announcementId_idx"
  ON "AnnouncementRecipient" ("announcementId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AnnouncementRecipient_announcementId_fkey'
  ) THEN
    ALTER TABLE "AnnouncementRecipient"
      ADD CONSTRAINT "AnnouncementRecipient_announcementId_fkey"
      FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AnnouncementRecipient_userId_fkey'
  ) THEN
    ALTER TABLE "AnnouncementRecipient"
      ADD CONSTRAINT "AnnouncementRecipient_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AnnouncementRecipient_schoolId_fkey'
  ) THEN
    ALTER TABLE "AnnouncementRecipient"
      ADD CONSTRAINT "AnnouncementRecipient_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE;
  END IF;
END $$;
