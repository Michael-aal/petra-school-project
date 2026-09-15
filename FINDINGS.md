# Tier 0 Hardening Findings

Date: 2026-09-15
Scope: read-only reconnaissance only. No application code was changed during Tier 0.

## 1. School-Owned Prisma Models

Models with a `schoolId` field or a direct `school` relation in `backend/prisma/schema.prisma`:

- `User` (line 9), `Role` (71), `Permission` (87), `StaffInvitation` (140)
- `Campus` (297), `AcademicYear` (311), `Term` (337), `Department` (363)
- `Class` (379), `Section` (401), `Subject` (419), `Classroom` (453)
- `Admin` (467), `Principal` (481), `VicePrincipal` (495), `Staff` (509)
- `Teacher` (526), `TeacherSubject` (551), `TeacherClass` (565)
- `Student` (579), `Parent` (621), `Guardian` (638), `StudentProfile` (680)
- `Admission` (723), `Enrollment` (800), `StudentAttendance` (842), `TeacherAttendance` (867)
- `Assessment` (882), `Result` (906), `Exam` (929), `ClassMarkerIntegration` (994)
- `Assignment` (1022), `GradeScale` (1058), `Grade` (1073), `ReportCard` (1094)
- `FeeCategory` (1111), `FeeStructure` (1126), `StudentFee` (1147), `Invoice` (1170)
- `Payment` (1206), `Receipt` (1252), `Scholarship` (1264), `Discount` (1278)
- `Fine` (1291), `InstallmentPlan` (1304), `BookCategory` (1333), `Book` (1348)
- `BorrowRecord` (1366), `Vehicle` (1383), `Route` (1396), `Driver` (1411)
- `StudentTransport` (1423), `Announcement` (1438), `Notification` (1449), `Message` (1462)
- `EmailLog` (1479), `Timetable` (1498), `TimetableEntry` (1509), `Hostel` (1527)
- `Room` (1539), `RoomAllocation` (1554), `AuditLog` (1568), `PaymentIdempotency` (1589)
- `ActivityLog` (1602), `Settings` (1613), `AcademicSession` (1625), `AcademicClass` (1639)
- `AcademicSubject` (1653), `ExpenseCategory` (1665), `Expense` (1678)

Models treated as global or relationship-only in this pass include `Session`, `RefreshToken`, `RolePermission`, `SubjectClass`, `StudentParent`, `GuardianStudent`, `StudentMedicalInfo`, `StudentDocument`, `AssignmentSubmission`, `InvoiceItem`, `PaymentLine`, `InstallmentPayment`, `ExamAttempt`, `ExamResult`, `WebhookEvent`, and `WebhookLog`.

## 2. ID-Based Prisma Operations

`Y` means the same operation selector/where includes `schoolId`. `N` means ownership was checked earlier or inferred elsewhere, but the mutation/read itself is not school-scoped. This is the P0.1 remediation inventory.

### Admissions and activation

- `backend/services/admissionService.js`: admission `findUnique` line 119 N; admission `update` 218 N; profile `findUnique` 323 N; student `update` 377 N; enrollment `update` 400 N; admission `update` 424, 448 N; profile `findUnique` 484 N; teacher `upsert` 676, 701 N; assessment `upsert` 678, 703 N.
- `backend/services/studentActivationService.js`: student `update` 150 N; profile `findUnique` 155 N; profile `update` 180 N; enrollment `update` 215 N; admission `update` 225 N.
- `backend/controllers/admissionController.js`: caller of `admissionService.enroll` at line 83.

### Finance and Paystack

- `backend/controllers/paystackController.js`: payment `findUnique` line 80 N.
- `backend/services/financeService.js`: fee category `upsert` 223 Y; payment `findUnique` 311 N; admission `update` 340 N; fee structure `update` 454 N; fee structure `delete` 480 N; payment `findUnique` 618 N; invoice `updateMany` 725 Y; payment `update` 786 N; receipt `deleteMany` 813 N; payment `delete` 814 N; payment `findUnique` 984, 1002 N; payment `update` 1010 N; invoice `update` 1026, 1054 N; student fee `update` 1044, 1071 N; invoice `findUnique` 1050 N; receipt `upsert` 1076 N; student `findUnique` 1098 N; failed-payment lookups/updates 1106-1145 N.
- `backend/services/expenseService.js`: expense category `upsert` line 69 Y.

### Academic, teaching, and integrations

- `backend/services/academicService.js`: academic year/term `updateMany` 45-46 Y; academic year/term `upsert` 49, 65 Y; academic session `update` 125 N; session `delete` 139 N; academic class `update` 153 N; class `delete` 163 N; academic subject `update` 175 N; subject `delete` 183 N.
- `backend/services/teacherService.js`: teacher `findUnique` 26 N; student attendance `update` 336 N; assessment `findUnique` 372, 393, 466 N; assessment `update` 378 N; assessment `delete` 399 N; result `findUnique` 506 N; result `update` 512 N.
- `backend/services/schoolConnectionService.js`: teacher-class `upsert` 69 N; teacher-class `delete` 82 N; teacher-subject `upsert` 90 N; subject-class `upsert` 103 N; subject-class `delete` 111 N; report card `update` 129 N.
- `backend/controllers/classMarkerController.js`: assessment `update` 814, 867, 999 N; ClassMarker integration `upsert` 878, 1010 N; assessment `findUnique` 932, 1166, 1301, 1543 N; exam `upsert` 1631 N; integration `upsert` 1583, 2568 N.

### Identity, staff, messaging, notifications, and email

- `backend/services/authService.js`: school `findUnique` 116, 185, 199-200 N; user `findUnique` 183 N; user `update` 188, 222 N.
- `backend/models/userModel.js`: user `findUnique` 18, 22, 26, 30, 34, 42, 49, 76, 83, 142 N; staff invitation `findUnique` 109 N; invitation `updateMany` 117 Y.
- `backend/services/teacherInvitationService.js`: school `findUnique` 53 N; invitation `findUnique` 83 N; transactional user/teacher lookups and updates 96-149 N.
- `backend/services/teacherManagementService.js`: teacher/user updates 153-154 N.
- `backend/services/messageService.js`: recipient user `findUnique` 97 N; tenant is checked after the lookup in application code.
- `backend/services/notificationService.js`: notification `updateMany` 134 N; notification `update` 151 N; notification `updateMany` 157 Y or platform-dependent.
- `backend/services/emailService.js`: email log `findUnique` 108, 140 N; email log `update` 117, 152, 156 N.
- `backend/services/parentAccessService.js`: user `findUnique` 98 N; student `findUnique` 114 Y when `schoolId` is supplied.
- `backend/services/studentService.js`: student lookups/updates 157, 314-342 N; cascading `deleteMany` operations for student-parent, guardian, fees, invoices, payments, installments, reports, exams, attendance, profile, and medical records 381-392 N; assignment `updateMany` 388 N.

## 3. Admission and Student-Activation Trace

- `backend/controllers/admissionController.js:83` calls `admissionService.enroll`.
- `backend/services/admissionService.js:274-433` creates student/profile/parent/enrollment records in a transaction.
- `backend/routes/paystackRoutes.js:6` mounts the public Paystack webhook route.
- `backend/controllers/paystackController.js:88-91` verifies the Paystack transaction and calls `financeService.processVerifiedPayment`.
- `backend/controllers/paystackController.js:116-128` calls `activateAdmittedStudentAfterFeePayment` only when the result includes `status === "Successful"`, `studentId`, and `schoolId`.
- `backend/services/studentActivationService.js:65-78` rechecks payment ownership using reference, school, and student.
- Student activation requires verified school-fee payment, then updates the student, profile, enrollment, and admission. Several later mutation selectors remain ID-only after scoped reads, as listed above.
- No second activation caller was identified in the targeted search. This needs the P0.2 integration trace before issue #31 can be closed.

## 4. Cookie Session and Logout

Live cookie options are in `backend/controllers/authController.js:12-19`:

- Access cookie: `petra_session`
- Refresh cookie: `petra_refresh`
- `HttpOnly: true`
- `Secure: process.env.NODE_ENV === "production"`
- `SameSite: "strict"`
- `Path: "/"`
- No `Domain`
- Access max age: 15 minutes
- Refresh max age: 30 days

Session creation is in `backend/controllers/authController.js:21-35`. Middleware reads only `petra_session` at `backend/middleware/authMiddleware.js:7-23` and validates expiry/revocation/session version at `backend/middleware/authMiddleware.js:99-129`.

Logout is server-side: `backend/controllers/authController.js:252-265` revokes the current session, revokes refresh tokens, writes an audit record, and clears both cookies. Password-change rotation revokes the current session and issues a replacement session.

## 5. CSRF and Origin Protection

- No dedicated CSRF middleware was found.
- Cookie authentication uses `SameSite=Strict`, but no explicit Origin/Referer enforcement is mounted in the live JavaScript entrypoint.
- `backend/middleware/originLock.js:15-34` implements an origin-secret check, but `backend/app.js` does not mount it.
- `backend/server.js:1-4` starts the live JavaScript app. The TypeScript wrapper references `enforceOriginLock`, but it is not the live entrypoint.
- `backend/app.js:42-78` enables CORS credentials and allows configured origins; CORS is not a complete CSRF defense for same-site cookie mutation requests.
- Paystack webhooks are mounted separately and use provider signatures rather than user-session cookies.

## 6. CI Reality

`.github/workflows/ci.yml`:

- PostgreSQL 16 service: lines 16-27.
- No Redis service is declared.
- `REDIS_URL=redis://localhost:6379` is set at line 37, but no process listens there in CI.
- Backend runs `npm ci` (53), PostgreSQL readiness (57-64), Prisma generate (68), `tsc --noEmit` (69), Prisma validate (73), migrations (76), seed (79), `npm test` (81), and `npm run test:security` (82).
- Frontend runs `npm ci` (95), lint (102), and build (105).
- CI sets JWT key secrets, database, CORS, and Redis URL, but does not visibly set `ORIGIN_SECRET` or `PAYSTACK_SECRET_KEY`.
- Existing tests can skip Redis/database integration coverage through environment gates; CI does not currently fail when those skips occur.

## 7. Documentation Drift

- `README.md:200` documents bearer tokens and a `petra_token` cookie; live middleware reads `petra_session`.
- `PRODUCTION_READINESS.md:7` says authentication uses bearer tokens/sessionStorage; live code uses HttpOnly cookie sessions.
- `ARCHITECTURE.md` describes `sessionStorage`, bearer headers, and `petra_token` in its authentication section; this conflicts with live code.
- `backend/AUTH_REFACTOR.md:9` documents `petra_token` and `SameSite=Lax`; live code uses `petra_session`/`petra_refresh` and `SameSite=Strict`.
- `API.md:23` says bearer-token revocation is not implemented; live logout/session revocation exists.
- `backend/README.md:45-47` describes logout invalidation as future work; it is implemented.
- `WORKFLOWS.md:111` correctly states that payment, student, invoice, and school ownership must agree, but the operation inventory above shows multiple ID-only selectors.
- `docs/AI_READINESS.md` says `POST /api/ai/query` returns 503 and no provider is connected. Live `backend/controllers/aiController.js` delegates to `handleAIQuery`; the current code path should be verified before any AI-related work.

## Tier 0 Gate

Tier 0 findings are complete. No application code was changed. The next permitted step is P0.1 tenant isolation, beginning with real two-school database tests and the listed same-query selector gaps.
