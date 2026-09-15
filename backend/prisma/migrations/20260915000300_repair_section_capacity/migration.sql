-- Repair the Section -> capacity field expected by the current Prisma schema.
-- Some existing databases have Section without capacity, which causes Prisma
-- to fail when Student -> Enrollment -> Section is loaded.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'Section') THEN
    ALTER TABLE "Section"
      ADD COLUMN IF NOT EXISTS "capacity" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;
