# Petra School — Final Database Workflow Hardening

This release completes the database-work-plan implementation that can be safely prepared without access to the production PostgreSQL database.

## Included

- Persistent unique `Admission.admissionCode`.
- Existing JSON admission codes backfilled into `Admission.admissionCode`.
- Admission enrollment workflow creates Student, StudentProfile, parent links, and Enrollment.
- Exam Attempt model with unique attempt numbering.
- Exam Result ↔ Exam Attempt relationship and backfill of existing results into attempt #1.
- Canonical `Exam` linkage for existing `Assessment` records through `Exam.assessmentId`.
- ClassMarker integration persistence and result synchronization into ExamAttempt/ExamResult when a student can be identified.
- Idempotent admission-offer email logging through `EmailLog.dedupeKey` and retry metadata.
- Legacy `Attendance` records copied into canonical `StudentAttendance` records.
- Teacher attendance writes now use `StudentAttendance` for student records while teacher/staff attendance remains separate in `TeacherAttendance`.
- Finance cashflow accepts date ranges, allowing daily reports to query exact dates instead of filtering only the latest 20 records.
- Additional reporting/performance indexes.
- Backend JavaScript syntax checks passed for all non-temporary backend JavaScript files.

## Intentionally retained

`AcademicSession`, `AcademicClass`, `AcademicSubject`, and the legacy `Attendance` table are retained rather than dropped. The project has existing data and historical code around these structures. Dropping them without inspecting the live database would violate the handoff requirement to keep existing data safe. The application code now uses the canonical structures for the affected workflows, while the legacy tables remain available for safe transition.

## Before applying the migration

1. Back up the PostgreSQL database.
2. Confirm `DATABASE_URL` points to the intended development database.
3. Install dependencies in `backend`.
4. Run `npx prisma generate`.
5. Run `npx prisma validate`.
6. Run the migration against the development database first.
7. Test admissions, ClassMarker synchronization, enrollment, attendance, finance, daily reports, and live overview.
8. Only after successful development testing should the migration be considered for production.

Never use `prisma migrate reset` against a database containing real school data.
