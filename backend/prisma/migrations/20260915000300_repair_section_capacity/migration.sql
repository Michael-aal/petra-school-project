-- Repair the Section.capacity column expected by the current Prisma schema.
-- Existing databases may have an older Section table without this field.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'Section') THEN
    ALTER TABLE "Section"
      ADD COLUMN IF NOT EXISTS "capacity" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;
