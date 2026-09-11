CREATE TABLE "AcademicSession" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "term" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AcademicSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AcademicClass" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "arm" TEXT,
  "level" TEXT,
  "teacherName" TEXT,
  "capacity" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AcademicClass_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AcademicSubject" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "category" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AcademicSubject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TimetableEntry" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "className" TEXT NOT NULL,
  "subjectName" TEXT NOT NULL,
  "dayOfWeek" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "room" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TimetableEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AcademicSession_schoolId_isActive_idx" ON "AcademicSession"("schoolId", "isActive");
CREATE INDEX "AcademicClass_schoolId_name_idx" ON "AcademicClass"("schoolId", "name");
CREATE INDEX "AcademicSubject_schoolId_name_idx" ON "AcademicSubject"("schoolId", "name");
CREATE INDEX "TimetableEntry_schoolId_className_dayOfWeek_idx" ON "TimetableEntry"("schoolId", "className", "dayOfWeek");

ALTER TABLE "AcademicSession" ADD CONSTRAINT "AcademicSession_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AcademicClass" ADD CONSTRAINT "AcademicClass_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AcademicSubject" ADD CONSTRAINT "AcademicSubject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
