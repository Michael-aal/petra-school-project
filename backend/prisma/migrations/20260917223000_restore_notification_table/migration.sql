-- Production schema repair: the Notification model is authoritative in schema.prisma,
-- but the table is absent from some production databases because the historical
-- schema migration that originally created it was intentionally skipped.
-- This repair is additive and idempotent: it never drops data or alters existing tables.

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Add the authoritative relations only when they are missing.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Notification_schoolId_fkey'
          AND conrelid = '"Notification"'::regclass
    ) THEN
        ALTER TABLE "Notification"
          ADD CONSTRAINT "Notification_schoolId_fkey"
          FOREIGN KEY ("schoolId") REFERENCES "School"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Notification_userId_fkey'
          AND conrelid = '"Notification"'::regclass
    ) THEN
        ALTER TABLE "Notification"
          ADD CONSTRAINT "Notification_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Prisma's model does not declare additional Notification indexes, so do not
-- invent any. The primary key above is the only generated index for this model.
