/*
  Warnings:

  - You are about to drop the column `address` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Student` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[admissionNumber]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[parentAccessCode]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[staffRegistrationCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[parentAccessCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "StaffInvitation" DROP CONSTRAINT "StaffInvitation_staffUserId_fkey";

-- DropIndex
DROP INDEX "FeeStructure_feeCategoryId_className_session_term_key";

-- DropIndex
DROP INDEX "Invoice_schoolId_studentId_idx";

-- DropIndex
DROP INDEX "InvoiceItem_invoiceId_description_key";

-- DropIndex
DROP INDEX "StaffInvitation_staffUserId_key";

-- AlterTable
ALTER TABLE "StaffInvitation" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "role" DROP NOT NULL,
ALTER COLUMN "department" DROP NOT NULL,
ALTER COLUMN "employmentStatus" DROP NOT NULL,
ALTER COLUMN "generatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "address",
DROP COLUMN "createdAt",
DROP COLUMN "deletedAt",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
ADD COLUMN     "admissionNumber" TEXT,
ADD COLUMN     "className" TEXT,
ADD COLUMN     "dob" TIMESTAMP(3),
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "guardianName" TEXT,
ADD COLUMN     "parentAccessCode" TEXT,
ADD COLUMN     "parentAccessCodeUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentEmail" TEXT,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "parentPhone" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountStatus" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "linkedStudentId" TEXT,
ADD COLUMN     "parentAccessCode" TEXT,
ADD COLUMN     "parentAccessCodeUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "staffRegistrationCode" TEXT,
ADD COLUMN     "staffRegistrationCodeUsed" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "role" SET DEFAULT 'parent';

-- CreateIndex
CREATE UNIQUE INDEX "Student_admissionNumber_key" ON "Student"("admissionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Student_parentAccessCode_key" ON "Student"("parentAccessCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_staffRegistrationCode_key" ON "User"("staffRegistrationCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_parentAccessCode_key" ON "User"("parentAccessCode");
