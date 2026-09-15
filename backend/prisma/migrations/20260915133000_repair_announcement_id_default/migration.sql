-- Repair the Announcement primary-key default that can be lost when the table
-- is restored/recreated outside Prisma migration history.
-- Keep the existing String @id contract and avoid changing or deleting data.

ALTER TABLE "Announcement"
  ALTER COLUMN "id" SET DEFAULT md5(random()::text || clock_timestamp()::text || txid_current()::text);
