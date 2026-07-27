ALTER TABLE IF EXISTS "User"
ADD COLUMN IF NOT EXISTS "schoolId" INTEGER,
ADD COLUMN IF NOT EXISTS "staffRole" TEXT,
ADD COLUMN IF NOT EXISTS "staffDepartment" TEXT,
ADD COLUMN IF NOT EXISTS "staffClassAssigned" TEXT,
ADD COLUMN IF NOT EXISTS "staffSubjectsAssigned" TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "staffPosition" TEXT,
ADD COLUMN IF NOT EXISTS "profileImage" TEXT;

CREATE TABLE IF NOT EXISTS "StaffInvitation" (
  "id" TEXT NOT NULL,
  "staffName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT,
  "department" TEXT,
  "assignedClass" TEXT,
  "assignedSubjects" TEXT[] NOT NULL DEFAULT '{}',
  "employmentStatus" TEXT DEFAULT 'active',
  "registrationCode" TEXT NOT NULL,
  "generatedBy" TEXT,
  "status" TEXT NOT NULL DEFAULT 'unused',
  "revokedAt" TIMESTAMP(3),
  "usedAt" TIMESTAMP(3),
  "staffUserId" TEXT,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StaffInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StaffInvitation_email_key" ON "StaffInvitation"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "StaffInvitation_registrationCode_key" ON "StaffInvitation"("registrationCode");

CREATE TABLE IF NOT EXISTS "Attendance" (
  "id" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "className" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Assessment" (
  "id" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "className" TEXT NOT NULL,
  "maxScore" INTEGER NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Result" (
  "id" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "assessmentId" TEXT,
  "subject" TEXT NOT NULL,
  "className" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "maxScore" INTEGER NOT NULL,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

ALTER TABLE IF EXISTS "Attendance" ADD CONSTRAINT "Attendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "Assessment" ADD CONSTRAINT "Assessment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "Result" ADD CONSTRAINT "Result_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "Result" ADD CONSTRAINT "Result_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE IF EXISTS "Result" ADD CONSTRAINT "Result_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
