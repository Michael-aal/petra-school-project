CREATE TABLE IF NOT EXISTS "StudentAttendance" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "studentId" TEXT NOT NULL,
  "academicYearId" TEXT,
  "termId" TEXT,
  "classId" TEXT,
  "attendanceDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'present',
  "remarks" TEXT,
  "markedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentAttendance_pkey" PRIMARY KEY ("id")
);

DO $$
DECLARE
  school_row RECORD;
  year_id TEXT;
BEGIN
  IF to_regclass('"School"') IS NULL OR to_regclass('"AcademicYear"') IS NULL OR to_regclass('"Term"') IS NULL THEN
    RETURN;
  END IF;

  FOR school_row IN SELECT id FROM "School" LOOP
    SELECT id INTO year_id
    FROM "AcademicYear"
    WHERE "schoolId" = school_row.id AND "isActive" = true
    ORDER BY "createdAt" DESC
    LIMIT 1;

    IF year_id IS NULL THEN
      INSERT INTO "AcademicYear" ("id", "schoolId", "name", "startsAt", "endsAt", "isActive", "createdAt", "updatedAt")
      VALUES (md5(random()::text || clock_timestamp()::text), school_row.id, '2026/2027', '2026-09-01T00:00:00Z', '2027-07-31T23:59:59Z', true, now(), now())
      RETURNING id INTO year_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Term" WHERE "academicYearId" = year_id AND "isActive" = true) THEN
      INSERT INTO "Term" ("id", "schoolId", "academicYearId", "name", "startsAt", "endsAt", "isActive", "createdAt", "updatedAt")
      VALUES (md5(random()::text || clock_timestamp()::text), school_row.id, year_id, 'First Term', '2026-09-01T00:00:00Z', '2026-12-18T23:59:59Z', true, now(), now());
    END IF;
  END LOOP;
END $$;

ALTER TABLE IF EXISTS "Attendance" ADD COLUMN IF NOT EXISTS "academicYearId" TEXT;
ALTER TABLE IF EXISTS "Attendance" ADD COLUMN IF NOT EXISTS "termId" TEXT;
ALTER TABLE "StudentAttendance" ADD COLUMN IF NOT EXISTS "academicYearId" TEXT;
ALTER TABLE "StudentAttendance" ADD COLUMN IF NOT EXISTS "termId" TEXT;
ALTER TABLE IF EXISTS "Grade" ADD COLUMN IF NOT EXISTS "academicYearId" TEXT;
ALTER TABLE IF EXISTS "Grade" ADD COLUMN IF NOT EXISTS "termId" TEXT;
ALTER TABLE IF EXISTS "StudentFee" ADD COLUMN IF NOT EXISTS "academicYearId" TEXT;
ALTER TABLE IF EXISTS "StudentFee" ADD COLUMN IF NOT EXISTS "termId" TEXT;
ALTER TABLE IF EXISTS "Invoice" ADD COLUMN IF NOT EXISTS "academicYearId" TEXT;
ALTER TABLE IF EXISTS "Invoice" ADD COLUMN IF NOT EXISTS "termId" TEXT;
ALTER TABLE IF EXISTS "Payment" ADD COLUMN IF NOT EXISTS "academicYearId" TEXT;
ALTER TABLE IF EXISTS "Payment" ADD COLUMN IF NOT EXISTS "termId" TEXT;

DO $$ BEGIN
  IF to_regclass('"Attendance"') IS NOT NULL
    AND to_regclass('"AcademicYear"') IS NOT NULL
    AND to_regclass('"Term"') IS NOT NULL THEN
    UPDATE "Attendance" a
    SET "academicYearId" = y.id, "termId" = t.id
    FROM "Student" s
    JOIN "AcademicYear" y ON y."schoolId" = s."schoolId" AND y."isActive" = true
    JOIN "Term" t ON t."academicYearId" = y.id AND t."isActive" = true
    WHERE a."studentId" = s.id AND (a."academicYearId" IS NULL OR a."termId" IS NULL);
  END IF;
END $$;
DO $$ BEGIN
  IF to_regclass('"AcademicYear"') IS NOT NULL AND to_regclass('"Term"') IS NOT NULL THEN
    UPDATE "StudentAttendance" a
    SET "academicYearId" = y.id, "termId" = t.id
    FROM "AcademicYear" y
    JOIN "Term" t ON t."academicYearId" = y.id AND t."isActive" = true
    WHERE a."schoolId" = y."schoolId" AND y."isActive" = true AND (a."academicYearId" IS NULL OR a."termId" IS NULL);
  END IF;
END $$;
DO $$ BEGIN
  IF to_regclass('"Grade"') IS NOT NULL THEN
    UPDATE "Grade" g
    SET "academicYearId" = y.id, "termId" = t.id
    FROM "AcademicYear" y
    JOIN "Term" t ON t."academicYearId" = y.id AND t."isActive" = true
    WHERE g."schoolId" = y."schoolId" AND y."isActive" = true AND (g."academicYearId" IS NULL OR g."termId" IS NULL);
  END IF;
END $$;
DO $$ BEGIN
  IF to_regclass('"AcademicYear"') IS NOT NULL AND to_regclass('"Term"') IS NOT NULL THEN
    IF to_regclass('"StudentFee"') IS NOT NULL THEN
      UPDATE "StudentFee" f
      SET "academicYearId" = y.id, "termId" = t.id
      FROM "AcademicYear" y
      JOIN "Term" t ON t."academicYearId" = y.id AND t."isActive" = true
      WHERE f."schoolId" = y."schoolId" AND y."isActive" = true AND (f."academicYearId" IS NULL OR f."termId" IS NULL);
    END IF;
    IF to_regclass('"Invoice"') IS NOT NULL THEN
      UPDATE "Invoice" i
      SET "academicYearId" = y.id, "termId" = t.id
      FROM "AcademicYear" y
      JOIN "Term" t ON t."academicYearId" = y.id AND t."isActive" = true
      WHERE i."schoolId" = y."schoolId" AND y."isActive" = true AND (i."academicYearId" IS NULL OR i."termId" IS NULL);
    END IF;
    IF to_regclass('"Payment"') IS NOT NULL THEN
      UPDATE "Payment" p
      SET "academicYearId" = y.id, "termId" = t.id
      FROM "AcademicYear" y
      JOIN "Term" t ON t."academicYearId" = y.id AND t."isActive" = true
      WHERE p."schoolId" = y."schoolId" AND y."isActive" = true AND (p."academicYearId" IS NULL OR p."termId" IS NULL);
    END IF;
  END IF;
  IF to_regclass('"Payment"') IS NOT NULL AND to_regclass('"Invoice"') IS NOT NULL THEN
    UPDATE "Payment" p
    SET "academicYearId" = i."academicYearId", "termId" = i."termId"
    FROM "Invoice" i
    WHERE p."invoiceId" = i.id AND (p."academicYearId" IS NULL OR p."termId" IS NULL);
  END IF;
END $$;

ALTER TABLE IF EXISTS "Attendance" ALTER COLUMN "academicYearId" SET NOT NULL, ALTER COLUMN "termId" SET NOT NULL;
ALTER TABLE IF EXISTS "StudentAttendance" ALTER COLUMN "academicYearId" SET NOT NULL, ALTER COLUMN "termId" SET NOT NULL;
ALTER TABLE IF EXISTS "Grade" ALTER COLUMN "academicYearId" SET NOT NULL, ALTER COLUMN "termId" SET NOT NULL;
ALTER TABLE IF EXISTS "StudentFee" ALTER COLUMN "academicYearId" SET NOT NULL, ALTER COLUMN "termId" SET NOT NULL;
ALTER TABLE IF EXISTS "Invoice" ALTER COLUMN "academicYearId" SET NOT NULL, ALTER COLUMN "termId" SET NOT NULL;
ALTER TABLE IF EXISTS "Payment" ALTER COLUMN "academicYearId" SET NOT NULL, ALTER COLUMN "termId" SET NOT NULL;

DO $$ BEGIN
  IF to_regclass('"AcademicYear"') IS NOT NULL AND to_regclass('"Term"') IS NOT NULL THEN
    ALTER TABLE IF EXISTS "Attendance" ADD CONSTRAINT "Attendance_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE IF EXISTS "Attendance" ADD CONSTRAINT "Attendance_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE IF EXISTS "StudentAttendance" ADD CONSTRAINT "StudentAttendance_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE IF EXISTS "StudentAttendance" ADD CONSTRAINT "StudentAttendance_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE IF EXISTS "Grade" ADD CONSTRAINT "Grade_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE IF EXISTS "Grade" ADD CONSTRAINT "Grade_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE IF EXISTS "StudentFee" ADD CONSTRAINT "StudentFee_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE IF EXISTS "StudentFee" ADD CONSTRAINT "StudentFee_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE IF EXISTS "Invoice" ADD CONSTRAINT "Invoice_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE IF EXISTS "Invoice" ADD CONSTRAINT "Invoice_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE IF EXISTS "Payment" ADD CONSTRAINT "Payment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE IF EXISTS "Payment" ADD CONSTRAINT "Payment_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('"Attendance"') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "Attendance_studentId_academicYearId_termId_idx" ON "Attendance"("studentId", "academicYearId", "termId");
  END IF;
  IF to_regclass('"StudentAttendance"') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "StudentAttendance_studentId_academicYearId_termId_idx" ON "StudentAttendance"("studentId", "academicYearId", "termId");
  END IF;
  IF to_regclass('"Grade"') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "Grade_studentId_academicYearId_termId_idx" ON "Grade"("studentId", "academicYearId", "termId");
  END IF;
  IF to_regclass('"StudentFee"') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "StudentFee_studentId_academicYearId_termId_idx" ON "StudentFee"("studentId", "academicYearId", "termId");
  END IF;
  IF to_regclass('"Payment"') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "Payment_studentId_academicYearId_termId_idx" ON "Payment"("studentId", "academicYearId", "termId");
  END IF;
END $$;

ALTER TABLE IF EXISTS "AuditLog" ADD COLUMN IF NOT EXISTS "entityId" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE IF EXISTS "AuditLog" ADD COLUMN IF NOT EXISTS "performedBy" TEXT NOT NULL DEFAULT 'system';
ALTER TABLE IF EXISTS "AuditLog" ADD COLUMN IF NOT EXISTS "oldData" JSONB;
ALTER TABLE IF EXISTS "AuditLog" ADD COLUMN IF NOT EXISTS "newData" JSONB;
DO $$ BEGIN
  IF to_regclass('"AuditLog"') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
    CREATE INDEX IF NOT EXISTS "AuditLog_performedBy_idx" ON "AuditLog"("performedBy");
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "PaymentIdempotency" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "statusCode" INTEGER,
  "response" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentIdempotency_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentIdempotency_key_key" ON "PaymentIdempotency"("key");
CREATE INDEX IF NOT EXISTS "PaymentIdempotency_schoolId_createdAt_idx" ON "PaymentIdempotency"("schoolId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "PaymentIdempotency" ADD CONSTRAINT "PaymentIdempotency_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  IF to_regclass('"Student"') IS NOT NULL THEN
    ALTER TABLE "Student" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS student_tenant_isolation ON "Student";
    CREATE POLICY student_tenant_isolation ON "Student"
      USING ("schoolId" = NULLIF(current_setting('app.current_school_id', true), '')::integer)
      WITH CHECK ("schoolId" = NULLIF(current_setting('app.current_school_id', true), '')::integer);
  END IF;
  IF to_regclass('"Grade"') IS NOT NULL THEN
    ALTER TABLE "Grade" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS grade_tenant_isolation ON "Grade";
    CREATE POLICY grade_tenant_isolation ON "Grade"
      USING ("schoolId" = NULLIF(current_setting('app.current_school_id', true), '')::integer)
      WITH CHECK ("schoolId" = NULLIF(current_setting('app.current_school_id', true), '')::integer);
  END IF;
  IF to_regclass('"StudentFee"') IS NOT NULL THEN
    ALTER TABLE "StudentFee" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS student_fee_tenant_isolation ON "StudentFee";
    CREATE POLICY student_fee_tenant_isolation ON "StudentFee"
      USING ("schoolId" = NULLIF(current_setting('app.current_school_id', true), '')::integer)
      WITH CHECK ("schoolId" = NULLIF(current_setting('app.current_school_id', true), '')::integer);
  END IF;
  IF to_regclass('"Payment"') IS NOT NULL THEN
    ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS payment_tenant_isolation ON "Payment";
    CREATE POLICY payment_tenant_isolation ON "Payment"
      USING ("schoolId" = NULLIF(current_setting('app.current_school_id', true), '')::integer)
      WITH CHECK ("schoolId" = NULLIF(current_setting('app.current_school_id', true), '')::integer);
  END IF;
END $$;
