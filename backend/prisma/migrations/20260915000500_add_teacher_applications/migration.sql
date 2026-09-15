CREATE TABLE "TeacherApplication" (
  "id" TEXT NOT NULL,
  "schoolId" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "firstName" TEXT NOT NULL,
  "middleName" TEXT,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "gender" TEXT,
  "dateOfBirth" TIMESTAMP(3),
  "nationality" TEXT,
  "stateOfOrigin" TEXT,
  "lga" TEXT,
  "maritalStatus" TEXT,
  "address" TEXT,
  "nin" TEXT,
  "qualification" TEXT,
  "institution" TEXT,
  "course" TEXT,
  "graduationYear" INTEGER,
  "teachingQualification" TEXT,
  "trcnNumber" TEXT,
  "specialization" TEXT,
  "majorSubject" TEXT,
  "minorSubject" TEXT,
  "experienceYears" INTEGER,
  "previousSchools" TEXT,
  "positionApplied" TEXT,
  "subjects" TEXT,
  "classLevels" TEXT,
  "employmentType" TEXT,
  "availableStartDate" TIMESTAMP(3),
  "expectedSalary" TEXT,
  "cvUrl" TEXT,
  "supportingDocuments" JSONB,
  "references" JSONB,
  "declarationAccepted" BOOLEAN NOT NULL DEFAULT false,
  "submissionData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeacherApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TeacherApplication_schoolId_status_createdAt_idx" ON "TeacherApplication"("schoolId", "status", "createdAt");
CREATE INDEX "TeacherApplication_schoolId_email_idx" ON "TeacherApplication"("schoolId", "email");

ALTER TABLE "TeacherApplication" ADD CONSTRAINT "TeacherApplication_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
