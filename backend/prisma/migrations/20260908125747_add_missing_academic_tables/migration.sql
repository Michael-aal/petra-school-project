CREATE TABLE IF NOT EXISTS "StudentAttendance" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "academicYearId" TEXT NOT NULL,
  "termId" TEXT NOT NULL,
  "classId" TEXT,
  "attendanceDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'present',
  "remarks" TEXT,
  "markedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentAttendance_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "StudentAttendance" 
  ADD CONSTRAINT "StudentAttendance_schoolId_fkey" 
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentAttendance" 
  ADD CONSTRAINT "StudentAttendance_studentId_fkey" 
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") 
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StudentAttendance" 
  ADD CONSTRAINT "StudentAttendance_academicYearId_fkey" 
  FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") 
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StudentAttendance" 
  ADD CONSTRAINT "StudentAttendance_termId_fkey" 
  FOREIGN KEY ("termId") REFERENCES "Term"("id") 
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StudentAttendance" 
  ADD CONSTRAINT "StudentAttendance_classId_fkey" 
  FOREIGN KEY ("classId") REFERENCES "Class"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "StudentAttendance_schoolId_attendanceDate_idx" 
  ON "StudentAttendance"("schoolId", "attendanceDate");

CREATE INDEX IF NOT EXISTS "StudentAttendance_studentId_attendanceDate_idx" 
  ON "StudentAttendance"("studentId", "attendanceDate");

CREATE INDEX IF NOT EXISTS "StudentAttendance_studentId_academicYearId_termId_idx" 
  ON "StudentAttendance"("studentId", "academicYearId", "termId");
