-- Restore inter-model relationship tables and columns that exist in schema.prisma
-- but are missing from the migration history.

ALTER TABLE IF EXISTS "AuditLog"
  ADD COLUMN IF NOT EXISTS "oldData" JSONB,
  ADD COLUMN IF NOT EXISTS "newData" JSONB;

ALTER TABLE IF EXISTS "Student"
  ADD COLUMN IF NOT EXISTS "admissionNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "className" TEXT,
  ADD COLUMN IF NOT EXISTS "dob" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "gender" TEXT,
  ADD COLUMN IF NOT EXISTS "guardianName" TEXT,
  ADD COLUMN IF NOT EXISTS "parentAccessCode" TEXT,
  ADD COLUMN IF NOT EXISTS "parentAccessCodeUsed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "parentEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "parentId" TEXT,
  ADD COLUMN IF NOT EXISTS "parentPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "userId" TEXT,
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';

CREATE UNIQUE INDEX IF NOT EXISTS "Student_admissionNumber_key"
  ON "Student"("admissionNumber");

CREATE UNIQUE INDEX IF NOT EXISTS "Student_parentAccessCode_key"
  ON "Student"("parentAccessCode");

CREATE UNIQUE INDEX IF NOT EXISTS "Student_userId_key"
  ON "Student"("userId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Student_userId_fkey') THEN
    ALTER TABLE "Student"
      ADD CONSTRAINT "Student_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "StudentProfile" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "admissionNumber" TEXT,
  "bloodGroup" TEXT,
  "emergencyContact" TEXT,
  "emergencyName" TEXT,
  "address" TEXT,
  "nationality" TEXT,
  "religion" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "schoolId" INTEGER,
  CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StudentProfile_studentId_key"
  ON "StudentProfile"("studentId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentProfile_studentId_fkey') THEN
    ALTER TABLE "StudentProfile"
      ADD CONSTRAINT "StudentProfile_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "Student"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentProfile_schoolId_fkey') THEN
    ALTER TABLE "StudentProfile"
      ADD CONSTRAINT "StudentProfile_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "StudentMedicalInfo" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "allergies" TEXT,
  "medicalConditions" TEXT,
  "medications" TEXT,
  "doctorName" TEXT,
  "doctorPhone" TEXT,
  "insuranceProvider" TEXT,
  "insuranceNumber" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentMedicalInfo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StudentMedicalInfo_studentId_key"
  ON "StudentMedicalInfo"("studentId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentMedicalInfo_studentId_fkey') THEN
    ALTER TABLE "StudentMedicalInfo"
      ADD CONSTRAINT "StudentMedicalInfo_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "Student"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Subject" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "departmentId" TEXT,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "category" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Subject_schoolId_name_key"
  ON "Subject"("schoolId", "name");

CREATE INDEX IF NOT EXISTS "Subject_schoolId_name_idx"
  ON "Subject"("schoolId", "name");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'Department') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Subject_departmentId_fkey') THEN
    ALTER TABLE "Subject"
      ADD CONSTRAINT "Subject_departmentId_fkey"
      FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Subject_schoolId_fkey') THEN
    ALTER TABLE "Subject"
      ADD CONSTRAINT "Subject_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "SubjectClass" (
  "id" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SubjectClass_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SubjectClass_classId_subjectId_key"
  ON "SubjectClass"("classId", "subjectId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SubjectClass_classId_fkey') THEN
    ALTER TABLE "SubjectClass"
      ADD CONSTRAINT "SubjectClass_classId_fkey"
      FOREIGN KEY ("classId") REFERENCES "Class"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SubjectClass_subjectId_fkey') THEN
    ALTER TABLE "SubjectClass"
      ADD CONSTRAINT "SubjectClass_subjectId_fkey"
      FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "TeacherClass" (
  "id" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeacherClass_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TeacherClass_teacherId_classId_key"
  ON "TeacherClass"("teacherId", "classId");

CREATE INDEX IF NOT EXISTS "TeacherClass_schoolId_teacherId_idx"
  ON "TeacherClass"("schoolId", "teacherId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherClass_teacherId_fkey') THEN
    ALTER TABLE "TeacherClass"
      ADD CONSTRAINT "TeacherClass_teacherId_fkey"
      FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherClass_classId_fkey') THEN
    ALTER TABLE "TeacherClass"
      ADD CONSTRAINT "TeacherClass_classId_fkey"
      FOREIGN KEY ("classId") REFERENCES "Class"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherClass_schoolId_fkey') THEN
    ALTER TABLE "TeacherClass"
      ADD CONSTRAINT "TeacherClass_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "TeacherSubject" (
  "id" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeacherSubject_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TeacherSubject_teacherId_subjectId_key"
  ON "TeacherSubject"("teacherId", "subjectId");

CREATE INDEX IF NOT EXISTS "TeacherSubject_schoolId_teacherId_idx"
  ON "TeacherSubject"("schoolId", "teacherId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherSubject_teacherId_fkey') THEN
    ALTER TABLE "TeacherSubject"
      ADD CONSTRAINT "TeacherSubject_teacherId_fkey"
      FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherSubject_subjectId_fkey') THEN
    ALTER TABLE "TeacherSubject"
      ADD CONSTRAINT "TeacherSubject_subjectId_fkey"
      FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherSubject_schoolId_fkey') THEN
    ALTER TABLE "TeacherSubject"
      ADD CONSTRAINT "TeacherSubject_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "StudentParent" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "relation" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentParent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StudentParent_studentId_parentId_key"
  ON "StudentParent"("studentId", "parentId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentParent_studentId_fkey') THEN
    ALTER TABLE "StudentParent"
      ADD CONSTRAINT "StudentParent_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "Student"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentParent_parentId_fkey') THEN
    ALTER TABLE "StudentParent"
      ADD CONSTRAINT "StudentParent_parentId_fkey"
      FOREIGN KEY ("parentId") REFERENCES "Parent"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "GuardianStudent" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "guardianId" TEXT NOT NULL,
  "relation" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuardianStudent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GuardianStudent_studentId_guardianId_key"
  ON "GuardianStudent"("studentId", "guardianId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GuardianStudent_studentId_fkey') THEN
    ALTER TABLE "GuardianStudent"
      ADD CONSTRAINT "GuardianStudent_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "Student"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GuardianStudent_guardianId_fkey') THEN
    ALTER TABLE "GuardianStudent"
      ADD CONSTRAINT "GuardianStudent_guardianId_fkey"
      FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
