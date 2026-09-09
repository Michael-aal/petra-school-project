-- The current Prisma schema treats School.address as optional.
-- The initial migration created it as NOT NULL, which breaks school registration.
ALTER TABLE "School"
  ALTER COLUMN "address" DROP NOT NULL;
