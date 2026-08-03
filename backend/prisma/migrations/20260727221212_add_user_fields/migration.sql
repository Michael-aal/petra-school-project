-- Restored migration file for 20260727221212_add_user_fields
-- This file was missing from the migration directory, causing Prisma migrate to fail.
-- It includes the schema updates required by the applied migration and the current Prisma schema.

ALTER TABLE "Student"
  ADD COLUMN IF NOT EXISTS "name" TEXT,
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';
