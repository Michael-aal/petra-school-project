# Petra Workflows

This document describes current behavior. Where implementation and intended business language differ, the difference is called out instead of silently changing behavior.

## Registration

```text
Register page
  -> authApi.register()
  -> POST /api/auth/register
  -> rate limiter + Zod validator
  -> authController.registerUser
  -> authService.register
  -> duplicate email/username/phone checks
  -> bcrypt hash
  -> transaction creates School (principal) and User/profile
  -> safe user + JWT response
  -> sessionStorage token + UserContext
  -> role dashboard
```

Principal registration requires an institution name and creates a school. Parent/staff flows have separate endpoints and invitation/access-code rules.

## Login and session restoration

```text
SignIn form
  -> authApi.login()
  -> OPTIONS preflight for JSON
  -> POST /api/auth/login
  -> login validator
  -> authService.login
  -> User lookup + bcrypt comparison
  -> audit event + JWT
  -> sessionStorage petra_auth_token
  -> authApi.me()
  -> UserContext / dashboard role path
```

On browser refresh, `UserProvider` reads the token, calls `/api/auth/me`, and restores the user. If the token is absent or invalid, dashboard routes redirect to `/signin`. Logout clears the browser token through the API client's `finally` handler, but existing bearer tokens are not server-revoked until expiry.

## School selection and tenant context

Normal users use their profile/user school. Super admins may select a school and send `x-school-id`. `protect` resolves the school, `schoolGuard` requires it where needed, and `runWithSchoolContext` makes it available to the Prisma extension. Services must still validate ownership for unique-ID operations.

## Applicant and admission

```text
Public applicant form
  -> POST /api/admissions
  -> admission validator/controller/service
  -> resolve target school
  -> generate application/admission/applicant/exam references
  -> create Admission
  -> optionally create Assessment/exam integration record
  -> applicant uses reference to start/launch assessment
```

Admissions are listed and decided by school principals. Approval can proceed to enrollment and student creation. Public admission submission currently accepts a school ID or falls back to the first active school; this is a documented abuse/routing risk requiring a product decision before changing.

## Exam and result synchronization

```text
Assessment/exam setup
  -> teacher/principal routes
  -> local Assessment/Exam records
  -> QuizLab/ClassMarker integration
  -> candidate invitation/launch
  -> external attempt/result
  -> result sync endpoint
  -> match by applicant/admission/application/exam reference
  -> ExamAttempt/ExamResult/Result records
  -> admission pass/fail or reporting workflow
```

Public exam-start paths must validate that the applicant and assessment belong to the same school before creating/publishing an external exam. This is a security refactoring priority.

## Enrollment and student creation

```text
Approved Admission
  -> principal enrollment endpoint
  -> enrollmentService transaction
  -> Student and StudentProfile
  -> parent/guardian records and join links where supplied
  -> Enrollment class/term placement
  -> student dashboard/access code
```

Student records are school-owned. Enrollment is the canonical transition from applicant/admission to active learner; do not create an alternate path without tracing existing admission and parent links.

## Parent and child linking

Parent registration creates a parent identity/profile. Child access can use access codes and parent/guardian join tables. `parentAccessService.js` contains compatibility logic for matching and loading linked children. Parent dashboard requests must remain tenant-scoped and must not expose unrelated students.

## Payments and fees

```text
School/student fee setup
  -> FeeCategory/FeeStructure/StudentFee or Invoice
  -> finance route creates Payment pending record
  -> paystackService initializes provider transaction
  -> Paystack webhook arrives with raw body
  -> HMAC signature verification
  -> provider transaction verification
  -> processVerifiedPayment
  -> mark Payment, update invoice/student fee, create Receipt
  -> notifications/email where configured
```

Wallet and direct finance payments are related but separate flows. Every payment update must verify that payment, student, invoice, and school IDs belong to the same tenant.

## Email and communication

Invitation and notification services call `emailService.js` and may write `EmailLog`. Announcements, messages, and notifications use their own route/controller/service/model paths. Provider failures should be logged with operation and provider context while returning safe API errors.

## AI queries

```text
Ask Nuvora page
  -> /api/ai/query
  -> protect + schoolGuard
  -> aiController
  -> orchestrator/provider
  -> permissioned ai tools
  -> domain service/data queries
  -> audit activity
```

AI tools must inherit the authenticated user and tenant scope; they must not accept an arbitrary school ID as authority.

## Failure diagnosis by workflow

- Registration/login failure: inspect `authApi.js`, `authRoutes.js`, validators, `authController.js`, `authService.js`, `userModel.js`, JWT utilities, and database connection.
- Dashboard refresh failure: inspect `sessionStorage`, `UserContext`, `/api/auth/me`, `protect`, role normalization, and `DashboardLay`.
- Admission failure: inspect public payload school selection, admission validator/service, `Admission` columns, and reference generation.
- Exam failure: inspect assessment school ownership, applicant reference matching, and QuizLab/ClassMarker response.
- Payment failure: inspect payment ownership, raw webhook signature, Paystack verification, and reconciliation service.
- Parent data failure: inspect join-table records, school context, and parent access service.
- Database failure: run Prisma validation/generation/migration checks, confirm `DATABASE_URL`, check `SELECT 1`, then inspect PostgreSQL logs.
