# Petra Architecture

## Purpose

Petra is a React/Vite school-operations frontend backed by an Express API, Prisma, and PostgreSQL. This document describes the current system as implemented. It is an orientation guide, not a proposal to replace the existing application.

## Repository map

- `Petra-Project/`: React/Vite browser application.
- `backend/`: Express API, domain services, Prisma schema, migrations, and tests.
- `backend/server.js`: process entry point, middleware order, route mounts, and graceful shutdown.
- `backend/config/db.js`: Prisma client, tenant context, and database startup probe.
- `backend/prisma/schema.prisma`: authoritative application data model.
- `docs/`: supporting architecture and product notes.

## Request path

```text
Browser page
  -> src/services/*Api.js
  -> fetch(API_BASE_URL + path)
  -> backend/server.js middleware
  -> mounted backend/routes/*Routes.js
  -> controllers/*Controller.js
  -> services/*Service.js
  -> Prisma client / model wrappers
  -> PostgreSQL
```

Routes should describe HTTP endpoints, controllers should translate HTTP to service calls, and services should contain business rules. The current code follows that shape, but many services call Prisma directly rather than through repositories. `backend/models/` is a partial set of wrappers, not a complete repository layer.

## Frontend architecture

`src/main.jsx` wires the application providers and React Router. `src/App.jsx` owns the route tree and the shared dashboard shell. Public authentication pages live under `src/Pages/Sigin/` (the directory name is historical).

Authentication state is owned by `src/context/UserContext.jsx`. It reads `petra_auth_token` from `sessionStorage`, calls `/api/auth/me` when a token exists, and exposes `authReady`, `userInfo`, and session actions. Dashboard routes are wrapped by `DashboardLay`, which waits for `authReady` and redirects users without an email to `/signin`.

The browser API layer is split across `src/services/authApi.js`, `apiClient.js`, and domain-specific clients such as `studentApi.js`, `financeApi.js`, and `teacherApi.js`. They all construct requests from `VITE_API_URL`; `apiClient.js` additionally sends `x-school-id` from `localStorage`.

Known frontend ownership issues:

- Several API clients duplicate fetch, JSON parsing, bearer-token, and error handling.
- `src/components/dashboard/context/` contains duplicate context files; `src/context/` is the provider tree wired by `main.jsx`.
- Public registration pages historically checked `/api/auth/me` before checking whether a token exists, producing expected 401 noise.
- `SuperAdminDashboard` uses an `id` route parameter while the current route is `/dev/*`; school-detail routing needs a focused fix.
- Role normalization maps `staff` to `teacher`, but some registration redirects still compare against `staff`.

These are refactoring candidates. They should be fixed in small slices with frontend tests or focused manual flows, not by deleting duplicate files immediately.

## Backend architecture

### Process and middleware

`backend/server.js` loads `backend/.env`, configures CORS, Helmet, compression, JSON parsing, URL encoding, Morgan logging, health checks, route mounts, not-found handling, and the error handler. It connects to PostgreSQL before listening on `PORT`.

CORS preserves credentials, localhost development, and controlled HTTPS GitHub Codespaces origins matching `*-<port>.app.github.dev`. The production Codespaces allowance should be restricted or disabled when deploying outside development.

### Domain ownership

| Domain | Routes | Controller | Service / integration | Main models |
|---|---|---|---|---|
| Authentication | `/api/auth` | `authController.js` | `authService.js`, `userModel.js` | `User`, `School`, role profiles, `Session`, `RefreshToken` |
| Schools and admin | `/api/schools`, `/api/admin`, `/api/superadmin` | school/admin/superAdmin controllers | school/admin/superAdmin services | `School`, `Campus`, `Settings`, role profiles |
| Academics | `/api/academic` | `academicController.js` | `academicService.js` | `AcademicYear`, `Term`, `Class`, `Section`, `Subject`, `Timetable` |
| Students | `/api/students`, `/api/enrollment` | student/enrollment controllers | student/enrollment services and partial models | `Student`, `StudentProfile`, `Enrollment`, medical/documents |
| Parents | `/api/parent` | `parentController.js` | `parentAccessService.js` | `Parent`, `Guardian`, `StudentParent`, `GuardianStudent` |
| Admissions | `/api/admissions` | `admissionController.js` | `admissionService.js` | `Admission`, `Enrollment`, `Student` |
| Teachers and staff | `/api/teacher` | `teacherController.js` | `teacherService.js` | `Teacher`, `Staff`, `TeacherClass`, `TeacherSubject` |
| Assessments and exams | `/api/assessments`, `/api/classmarker` | classMarker controller and assessment routes | teacher/admission services, `quizlabService.js` | `Assessment`, `Exam`, `ExamAttempt`, `ExamResult`, `Result`, ClassMarker integration |
| Finance | `/api/finance`, `/api/paystack` | finance/paystack controllers | `financeService.js`, `paystackService.js` | invoices, fees, payments, receipts, scholarships, fines |
| Wallets | `/api/wallet` | wallet controller | `walletService.js`, `walletModel.js` | `Wallet`, `Transaction` |
| Communication | `/api/announcements`, `/api/messages` | announcement/message controllers | corresponding services | `Announcement`, `Notification`, `Message`, `EmailLog` |
| AI | `/api/ai` | `aiController.js` | `ai/orchestrator.js`, `aiDataService.js`, permission/tools modules | reads domain models; audit events use `AuditLog` |

## Authentication and authorization

1. The frontend submits credentials to `POST /api/auth/login`.
2. `authRoutes.js` applies the rate limiter and `loginValidator`.
3. `authController.loginUser` delegates to `authService.login`.
4. `authService` normalizes email, loads `User`, compares bcrypt password hashes, writes an audit event, and signs a JWT.
5. `authApi.js` stores the JWT in `sessionStorage` under `petra_auth_token`.
6. Subsequent API clients send `Authorization: Bearer <token>`.
7. `authMiddleware.protect` verifies the JWT, reloads the user globally, resolves school context, and calls `runWithSchoolContext`.
8. `requireRole`, `requirePrincipal`, `requireParent`, and `schoolGuard` enforce role and tenant requirements.
9. `UserContext` calls `/api/auth/me` on refresh and restores the dashboard session.

JWT claims include `id`, `userId`, `sub`, email, role, and school ID. The current schema also contains `Session` and `RefreshToken`, but the browser flow uses bearer JWTs and logout does not revoke already issued bearer tokens.

## Tenant context

Normal users resolve a school from their user/profile relationship. Super admins may select a school with `x-school-id` or persisted `selectedSchoolId`. `backend/config/db.js` uses `AsyncLocalStorage` and a Prisma extension to add school filters to selected operations and school IDs to writes.

This is a defense-in-depth mechanism, not a substitute for explicit service authorization. In particular, `findUnique`, `update`, and `delete` operations are not automatically scoped by the extension, so services must validate ownership before operating on IDs.

## Error handling

Validators return structured 400 responses. Controllers pass service errors to `middleware/errorMiddleware.js`. The error middleware chooses a status code, logs request metadata, and returns a safe response; production must be configured explicitly so stack details are not exposed.

When diagnosing failures, inspect in this order:

1. Browser network request and loaded `VITE_API_URL`.
2. `server.js` route mount and CORS result.
3. Route middleware order and validator response.
4. Controller and service logs.
5. Prisma query/error and PostgreSQL container logs.
6. Tenant context (`schoolId`, `selectedSchoolId`, and `x-school-id`).
7. External provider logs for Paystack or QuizLab.

## Integrations

- Paystack: payment initialization, webhook raw-body signature verification, transaction verification, and payment reconciliation.
- QuizLab/ClassMarker: remote exam creation, candidate launch, invitations, and result synchronization.
- Email: `emailService.js`, used by invitation and notification workflows.
- AI: provider/orchestrator/tool layer with permissioned data access.

## Refactoring direction

The safest next steps are focused boundary improvements: centralize the browser request primitive, add explicit repository functions for repeated identity/tenant queries, fix public-page session checks, enforce tenant ownership on exam/payment ID operations, and add contract tests around each domain. Do not move all files into a new `src/modules` tree in one operation.
