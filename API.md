# Petra API Contract

## Base URLs

- Local frontend: `http://localhost:5173`
- Local API: `http://localhost:5000`
- Codespaces frontend/API URLs are configured through `Petra-Project/.env` and `backend/.env`.

The browser API clients append paths beginning with `/api`. Credentials are included. Protected requests send `Authorization: Bearer <JWT>` and, where selected, `x-school-id`.

## Response conventions

Success responses generally include `success: true` and domain data. Validation and service failures generally include `success: false` and `message`; validators may also include an `errors` array. The error middleware is the final boundary and must not expose database internals in production.

## Authentication

| Method | Endpoint | Auth | Role/school | Request | Result |
|---|---|---|---|---|---|
| `POST` | `/api/auth/register` | No | Public; principal registration creates a school | `firstName`, `lastName`, `username`, `email`, `password`, `confirmPassword`, `role`, optional profile/school fields | `201`, user-safe data, JWT |
| `POST` | `/api/auth/parent/register` | No | Public parent flow | Parent registration payload | `201`, user-safe data, JWT |
| `POST` | `/api/auth/login` | No | Public | `email`, `password` | `200`, user-safe data, JWT |
| `GET` | `/api/auth/me` | JWT/cookie | User identity | No body | Current authenticated user |
| `POST` | `/api/auth/logout` | JWT/cookie | User | No body | Logout acknowledgement; bearer-token revocation is not currently implemented |
| `POST` | `/api/auth/select-school` | JWT | Super admin | `schoolId` | Selected school context |
| `PUT` | `/api/auth/profile` | JWT | User | Profile fields | Updated profile |
| `POST` | `/api/auth/change-password` | JWT | User | `currentPassword`, `newPassword` | Updated password |

## Schools, academics, and people

| Prefix | Main operations | Auth boundary |
|---|---|---|
| `/api/schools` | School administration | JWT and role checks |
| `/api/admin` | Admin/staff management and setup | JWT, school context, principal/admin role |
| `/api/superadmin` | Platform school/user operations | JWT, super-admin role |
| `/api/academic` | Sessions, classes, subjects, timetables | JWT, usually principal role and school context |
| `/api/students` | List, create, update, delete, access codes | JWT, school context, principal role |
| `/api/parent` | Parent dashboard and child access | JWT, parent role |
| `/api/enrollment` | Enrollment creation and retrieval | JWT, principal role |
| `/api/teacher` | Teacher workspace, attendance, assessments, results | JWT, teacher/principal role and school context |

## Admissions and exams

| Method/prefix | Purpose | Auth boundary |
|---|---|---|
| `POST /api/admissions` | Public admission/application submission | Public validator; school selection is part of the payload/current fallback behavior |
| `GET /api/admissions` | List admissions | Protected principal/school context |
| `POST /api/admissions/:id/enroll` | Enroll an admitted applicant | Protected principal |
| `POST /api/admissions/:id/complete-student` | Complete student record | Protected principal |
| `/api/assessments` | Applicant exam start and assessment operations | Some public applicant operations; inspect route before changing |
| `/api/classmarker` | External exam creation, launch, and result sync | Mixed public candidate and protected staff operations |

## Finance and integrations

| Prefix | Purpose | Auth boundary |
|---|---|---|
| `/api/finance` | Fees, invoices, payments, receipts, cash flow | JWT, school context, role-dependent |
| `/api/wallet` | Wallet balance, transfer, withdrawal, Paystack initialization | JWT and allowed roles |
| `POST /api/paystack/webhook` | Provider callback | Public provider endpoint; HMAC signature verification required |
| `/api/announcements` | School announcements/read/react | JWT and school context |
| `/api/messages` | Direct messages | JWT |
| `/api/ai` | Permissioned AI query | JWT and school guard |

## Contract debugging checklist

1. Confirm the frontend helper's `API_BASE_URL` and the path do not duplicate `/api`.
2. Confirm the request origin appears in the CORS response.
3. Confirm `OPTIONS` succeeds for JSON requests.
4. Confirm route mount in `backend/server.js` and endpoint in the route file.
5. Confirm validator field names and status code.
6. Confirm controller response shape matches the frontend consumer.
7. Confirm `Authorization` and `x-school-id` headers.
8. Confirm tenant ownership before ID-based database operations.
9. Check service logs, Prisma errors, PostgreSQL logs, and external provider responses.
