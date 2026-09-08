-- Keep the School table aligned with prisma/schema.prisma before creating
-- the composite uniqueness constraint used by the Prisma client.
ALTER TABLE "School"
  ADD COLUMN IF NOT EXISTS "country" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "School_name_country_key"
  ON "School"("name", "country");
