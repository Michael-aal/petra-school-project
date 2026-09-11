-- Restore core profile tables and columns that were present in schema.prisma
-- but never materialized in the migration history.

ALTER TABLE IF EXISTS "Teacher"
  ADD COLUMN IF NOT EXISTS "userId" TEXT,
  ADD COLUMN IF NOT EXISTS "departmentId" TEXT,
  ADD COLUMN IF NOT EXISTS "designation" TEXT,
  ADD COLUMN IF NOT EXISTS "hireDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Teacher"
SET "updatedAt" = COALESCE("updatedAt", NOW())
WHERE "updatedAt" IS NULL;

UPDATE "Teacher"
SET "createdAt" = COALESCE("createdAt", NOW())
WHERE "createdAt" IS NULL;

ALTER TABLE IF EXISTS "Teacher"
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS "Teacher"
  ALTER COLUMN "isActive" SET DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS "Teacher_userId_key"
  ON "Teacher"("userId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Teacher_userId_fkey') THEN
    ALTER TABLE "Teacher"
      ADD CONSTRAINT "Teacher_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE IF EXISTS "Parent"
  ADD COLUMN IF NOT EXISTS "address" TEXT,
  ADD COLUMN IF NOT EXISTS "email" TEXT,
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "userId" TEXT;

UPDATE "Parent"
SET "updatedAt" = COALESCE("updatedAt", NOW())
WHERE "updatedAt" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Parent_userId_key"
  ON "Parent"("userId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Parent_userId_fkey') THEN
    ALTER TABLE "Parent"
      ADD CONSTRAINT "Parent_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Guardian" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "schoolId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "relation" TEXT,
  "address" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Guardian_userId_key"
  ON "Guardian"("userId");

CREATE INDEX IF NOT EXISTS "Guardian_schoolId_name_idx"
  ON "Guardian"("schoolId", "name");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Guardian_schoolId_fkey') THEN
    ALTER TABLE "Guardian"
      ADD CONSTRAINT "Guardian_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Guardian_userId_fkey') THEN
    ALTER TABLE "Guardian"
      ADD CONSTRAINT "Guardian_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Staff" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "schoolId" INTEGER NOT NULL,
  "departmentId" TEXT,
  "designation" TEXT,
  "employmentStatus" TEXT NOT NULL DEFAULT 'active',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Staff_userId_key"
  ON "Staff"("userId");

CREATE INDEX IF NOT EXISTS "Staff_schoolId_isActive_idx"
  ON "Staff"("schoolId", "isActive");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Staff_schoolId_fkey') THEN
    ALTER TABLE "Staff"
      ADD CONSTRAINT "Staff_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Staff_userId_fkey') THEN
    ALTER TABLE "Staff"
      ADD CONSTRAINT "Staff_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF to_regclass('"Department"') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Staff_departmentId_fkey') THEN
    ALTER TABLE "Staff"
      ADD CONSTRAINT "Staff_departmentId_fkey"
      FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT,
  "entityId" TEXT NOT NULL DEFAULT 'unknown',
  "performedBy" TEXT NOT NULL DEFAULT 'system',
  "oldData" JSONB,
  "newData" JSONB,
  "details" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE IF EXISTS "AuditLog"
  ADD COLUMN IF NOT EXISTS "oldData" JSONB,
  ADD COLUMN IF NOT EXISTS "newData" JSONB;

CREATE INDEX IF NOT EXISTS "AuditLog_entity_entityId_idx"
  ON "AuditLog"("entity", "entityId");

CREATE INDEX IF NOT EXISTS "AuditLog_performedBy_idx"
  ON "AuditLog"("performedBy");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_schoolId_fkey') THEN
    ALTER TABLE "AuditLog"
      ADD CONSTRAINT "AuditLog_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_userId_fkey') THEN
    ALTER TABLE "AuditLog"
      ADD CONSTRAINT "AuditLog_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
