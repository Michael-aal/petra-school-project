-- The legacy Teacher table originally had a required `name` column.
-- The current Prisma Teacher model uses User.fullName instead and no longer
-- maps that legacy column. Make the legacy column nullable so Prisma can
-- create Teacher records without supplying an unmapped field.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Teacher' AND column_name = 'name'
  ) THEN
    ALTER TABLE "Teacher" ALTER COLUMN "name" DROP NOT NULL;
  END IF;
END $$;
