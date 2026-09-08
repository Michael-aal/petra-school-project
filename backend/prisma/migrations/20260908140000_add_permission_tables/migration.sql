CREATE TABLE IF NOT EXISTS "Permission" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Permission_code_key"
  ON "Permission"("code");

CREATE INDEX IF NOT EXISTS "Permission_schoolId_code_idx"
  ON "Permission"("schoolId", "code");

CREATE TABLE IF NOT EXISTS "RolePermission" (
  "id" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_roleId_permissionId_key"
  ON "RolePermission"("roleId", "permissionId");

ALTER TABLE IF EXISTS "RolePermission"
  ADD CONSTRAINT "RolePermission_permissionId_fkey"
  FOREIGN KEY ("permissionId")
  REFERENCES "Permission"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "RolePermission"
  ADD CONSTRAINT "RolePermission_roleId_fkey"
  FOREIGN KEY ("roleId")
  REFERENCES "Role"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
