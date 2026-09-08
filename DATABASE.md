# Petra Database Guide

## Source of truth

The application schema is `backend/prisma/schema.prisma`. PostgreSQL is configured through `backend/.env` and Prisma through `backend/prisma.config.ts`. Migrations live in `backend/prisma/migrations/` and are applied with `npx prisma migrate deploy`.

The database is multi-tenant: most operational records carry `schoolId`, directly or through a profile/parent/teacher relationship. The Prisma extension in `backend/config/db.js` applies additional school scoping for selected operations.

## Core identity and tenancy

| Model | Meaning | Key relationships |
|---|---|---|
| `User` | Login identity and common profile fields. | Optional `schoolId`, selected school, role reference, one-to-one role profiles, sessions, refresh tokens. |
| `School` | Tenant/institution workspace. | Campuses, academic setup, users/profiles, students, admissions, finance, communication, settings. |
| `Role` | Named role definition, optionally school-specific. | Users and role permissions. |
| `Permission` | Permission code and description. | Many-to-many through `RolePermission`. |
| `RolePermission` | Role-to-permission join. | `Role` and `Permission`. |
| `Session` | Persistent session record available to the schema. | Belongs to `User`; current browser flow primarily uses JWTs. |
| `RefreshToken` | Refresh-token storage available to the schema. | Belongs to `User`; current login flow does not depend on it. |
| `AuditLog` | Security and business audit event. | Optional `userId` and `schoolId`; both are foreign keys when non-null. |
| `ActivityLog` | User activity history. | Belongs to `User`. |
| `Settings` | School/application settings. | School-owned configuration. |

### Important identity rule

`User.id` is a cuid string. Test fixtures that use IDs such as `principal-user-1` without inserting matching `User` rows will violate `AuditLog_userId_fkey`; those are fixture/data errors, not valid production identity values.

## School setup and academics

| Group | Models | Responsibility |
|---|---|---|
| School structure | `Campus`, `Department`, `Class`, `Section`, `Classroom` | Physical and organizational school structure. |
| Calendar | `AcademicYear`, `Term`, `AcademicSession` | Time periods used by academic and financial records. |
| Subjects | `Subject`, `SubjectClass`, `AcademicClass`, `AcademicSubject` | Curriculum and class-subject assignment. The similarly named legacy academic models require usage review before consolidation. |
| Scheduling | `Timetable`, `TimetableEntry` | Timetable definitions and entries. |
| People | `Admin`, `Principal`, `VicePrincipal`, `Staff`, `Teacher` | Role/profile records linked to `User` and usually `School`. |
| Teacher assignment | `TeacherSubject`, `TeacherClass` | Teacher-to-subject and teacher-to-class relationships. |

## Student and parent domain

| Model | Meaning |
|---|---|
| `Student` | Canonical learner record, linked to a school and optionally a user/profile. |
| `StudentProfile` | Extended student profile data. |
| `StudentMedicalInfo` | Medical details for a student. |
| `StudentDocument` | Student files/document metadata. |
| `Parent` | Parent profile linked to a user and school. |
| `Guardian` | Guardian profile linked to a user/student relationship. |
| `StudentParent` | Parent-to-student join with relationship metadata. |
| `GuardianStudent` | Guardian-to-student join. |
| `Enrollment` | Student placement in class/section/calendar context. |
| `Attendance`, `StudentAttendance`, `TeacherAttendance` | Attendance records for users and students. |

Student creation is primarily performed by enrollment/admission services. Parent-child access should use `StudentParent` or `GuardianStudent`, not ad-hoc email matching alone; email matching remains a compatibility path in `parentAccessService.js`.

## Applicant and admission domain

`Admission` is the current applicant/application record. It contains applicant identity, family/contact data, school, status, references, exam/payment fields, optional student linkage, and JSON/remarks compatibility fields. The current public admission endpoint creates an admission and may generate application/admission/applicant/exam references.

Admissions may become:

```text
Admission -> Exam/Assessment reference -> result/attempt
Admission -> approved decision -> Enrollment -> Student
Student -> Parent/Guardian relationship -> dashboard access
```

`Enrollment` is the transition record and may create the student/profile/parent relationships in a transaction. Do not rename or remove `Admission`, `Enrollment`, or reference fields without tracing the public admission form, exam launch, result sync, and enrollment services.

## Exams and learning

| Model | Meaning |
|---|---|
| `Assessment` | Teacher/principal assessment definition. |
| `AssessmentItem` | Question/item belonging to an assessment. |
| `Exam` | Exam metadata. |
| `ExamAttempt` | A learner's attempt at an exam. |
| `ExamResult` | Exam result record. |
| `Result` | Broader academic result record. |
| `GradeScale`, `Grade`, `ReportCard` | Grading and reporting. |
| `Assignment`, `AssignmentSubmission` | Coursework and submissions. |
| `ClassMarkerIntegration` | External exam-provider configuration/reference. |

External QuizLab/ClassMarker IDs and applicant/admission references are integration keys, not replacements for local foreign keys. Exam controllers must validate school ownership before loading or mutating an assessment by ID.

## Finance and payments

| Group | Models | Responsibility |
|---|---|---|
| Fees | `FeeCategory`, `FeeStructure`, `StudentFee` | Fee definitions and student assignments. |
| Billing | `Invoice`, `InvoiceItem`, `InstallmentPlan`, `InstallmentPayment` | Amounts owed and installment schedules. |
| Payments | `PaymentMethod`, `Payment`, `Receipt` | Payment attempts, provider references, and receipts. |
| Adjustments | `Scholarship`, `Discount`, `Fine` | Changes to payable amounts. |
| Wallet | `Wallet`, `Transaction` | Stored value and wallet movements. |
| Expenses | `ExpenseCategory`, `Expense` | School expenditure records. |

A payment's `schoolId`, `studentId`, and `invoiceId` must all describe records belonging to the same tenant. The current `financeService.updatePayment` path needs an ownership check for related student/invoice IDs before it is considered a complete repository boundary.

## Communication and operations

- `Announcement`: school announcements and reactions/read state where modeled.
- `Notification`: user notifications.
- `Message`: direct messages between users.
- `EmailLog`: outbound email history.
- `BookCategory`, `Book`, `BorrowRecord`: library operations.
- `Vehicle`, `Route`, `Driver`, `StudentTransport`: transportation.
- `Hostel`, `Room`, `RoomAllocation`: accommodation.

## Schema observations and candidates

These are audit findings, not deletion instructions:

- `AcademicSession`/`AcademicYear` and `AcademicClass`/`Class`/`AcademicSubject`/`Subject` have overlapping naming and require usage tracing before consolidation.
- `User` contains both common identity fields and role/profile compatibility fields; moving fields is a migration project, not a cleanup rename.
- Several profile models and join models intentionally duplicate school relationships for tenant checks.
- `Session` and `RefreshToken` exist but are not the primary browser authentication persistence mechanism.
- Legacy admission fields and JSON compatibility fields are used to bridge database versions; they should be retired only after endpoint and migration usage reports prove they are unused.

## Database diagnostics

```bash
cd backend
npx prisma validate
npx prisma generate
npx prisma migrate status
npx prisma migrate deploy
```

For a direct, read-only connection check, the application startup probe runs `SELECT 1`. A failure with `ECONNREFUSED` indicates database availability/network failure, not invalid SQL. PostgreSQL server logs are available with `docker logs petra-postgres` in local development.
