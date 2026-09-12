-- The legacy Teacher table originally had a required `name` column.
-- The current Prisma Teacher model uses User.fullName instead and no longer
-- maps that legacy column. Make the legacy column nullable so Prisma can
-- create Teacher records without supplying an unmapped field.

ALTER TABLE IF EXISTS "Teacher"
  ALTER COLUMN "name" DROP NOT NULL;
