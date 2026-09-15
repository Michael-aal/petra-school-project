# Petra School Platform — Product Requirements Document (PRD)

**Document version:** 1.0  
**Date:** September 15, 2026  
**Product:** Petra School Platform  
**Repository:** `Michael-aal/petra-school-project`  
**Status:** Active development / pre-production hardening

---

## 1. Executive Summary

Petra is a multi-tenant school operations platform designed to bring school administration, academics, admissions, finance, communication, student/parent services, and selected integrations into one secure workspace.

The current implementation is a React/Vite web application backed by an Express/Prisma API, PostgreSQL, Redis, background jobs, and external integrations such as Paystack and ClassMarker. The repository already contains substantial production-oriented controls including JWT authentication, role/resource authorization, school-aware access control, rate limiting, Helmet, request IDs, structured logging, automated CI, database migrations, and automated tests.

This PRD defines the product scope, functional requirements, security requirements, quality gates, operational requirements, and release criteria needed to move Petra from active development toward a controlled production release.

---

## 2. Product Vision

Provide schools with a reliable, secure, role-aware digital operating system where authorized school users can manage people, learning, admissions, money, communication, and school operations from one platform.

### Product principles

1. **Security first:** tenant isolation and least-privilege access are mandatory.
2. **One source of truth:** business state is authoritative on the server.
3. **Role-aware UX:** each role sees only the workflows and data it needs.
4. **Auditability:** important administrative and financial actions must be traceable.
5. **Reliability:** external integrations must fail safely and retry where appropriate.
6. **Usability:** common school tasks should require minimal unnecessary steps.
7. **Maintainability:** reuse existing domain services, routes, models, and workflows rather than creating parallel systems.

---

## 3. Current Product Scope

The repository documents the following product areas:

- School setup and configuration
- Classes, sections, subjects, sessions, departments, and timetables
- Student records and parent/guardian relationships
- Admissions and enrollment
- Applicant workflows and admission-pass flows
- Attendance
- Assessments, examinations, CBT, results, and report cards
- Fees, invoices, payments, receipts, discounts, cash flow, and extra fees
- Wallets and transactions
- Announcements
- Direct messaging and voice-note communication
- In-app and external device notifications
- Staff and teacher workflows
- Platform-level school administration
- Paystack integration
- ClassMarker/assessment integration
- Permissioned Ask Nuvora AI foundation

The repository README describes Petra as a multi-tenant platform with school-aware access control across authenticated requests. fileciteturn293file0

---

## 4. User Roles

### Platform administration
- Super administrator
- Platform-level school management

### School administration
- Principal/admin
- School staff
- Finance/admin operators

### Academic users
- Teachers

### Family and learner users
- Parents/guardians
- Students

Every role must be evaluated against explicit permissions and resource ownership rather than UI visibility alone.

---

## 5. Functional Requirements

### 5.1 Authentication and sessions

**Must:**
- Authenticate users securely.
- Hash passwords before persistence.
- Support access/session lifecycle and refresh behavior.
- Enforce account status.
- Prevent unauthorized role escalation.
- Provide safe logout/session invalidation.
- Support password/account recovery through a verified flow.
- Maintain auditability for sensitive authentication events.

**Acceptance criteria:**
- Invalid credentials never reveal whether an email/username exists.
- Expired/revoked sessions cannot access protected resources.
- Changing sensitive credentials invalidates appropriate prior sessions.
- Authentication endpoints remain rate limited under load.

### 5.2 Multi-tenancy and authorization

**Must:**
- Resolve school context from authenticated server-side identity.
- Enforce tenant boundaries on reads and writes.
- Prevent client-provided `schoolId` from becoming an authorization decision.
- Enforce parent-to-child and student-to-self restrictions.
- Enforce role and resource permissions on every protected domain.

**Acceptance criteria:**
- A user from School A cannot read, mutate, export, or infer protected records belonging to School B.
- Direct API calls are subject to the same authorization as the UI.
- Cross-tenant tests exist for every sensitive domain.

### 5.3 School administration

**Must:**
- Configure school profile and operational settings.
- Manage academic structure, staff, roles, and school configuration.
- Preserve administrative audit trails.

### 5.4 Student and parent management

**Must:**
- Create and maintain student records.
- Link parents/guardians to authorized students.
- Prevent unauthorized family-data access.
- Support enrollment and account activation workflows.

### 5.5 Admissions

**Target flow:**

`Application → Admin review → Approval → Enrollment → Student record → Exam/CBT where applicable → Result → Admission/pass communication → Required payment → Account activation`

**Must:**
- Preserve applicant data through approval.
- Allow authorized administrators to enroll an approved applicant.
- Avoid duplicate student creation.
- Keep admission status transitions explicit and auditable.
- Ensure payment gates cannot be bypassed by client-side state changes.

### 5.6 Academics and assessment

**Must:**
- Manage sessions, terms, classes, subjects, attendance, assessments, exams, CBT, results, report cards, and timetables.
- Integrate external assessment providers without making external provider state the sole local source of truth.
- Handle duplicate webhooks/attempt callbacks safely.

### 5.7 Finance and payments

**Must:**
- Configure fee structures and extra fees.
- Support quantities/units where configured.
- Create payment attempts/transactions.
- Verify payment-provider webhooks cryptographically.
- Make payment processing idempotent.
- Reconcile provider events with local financial records.
- Prevent users from modifying payment status from the client.
- Provide receipts/statements appropriate to the user's role.

**Acceptance criteria:**
- Replaying the same provider event does not create duplicate financial records.
- A successful payment cannot activate the wrong student or school.
- Cross-school payment records are inaccessible.

### 5.8 Communication

**Must:**
- Support announcements with audience targeting.
- Support direct user messaging.
- Support voice-note messages where enabled.
- Store message history according to product retention rules.
- Allow users to delete their own notification records where permitted.

### 5.9 Notifications

**Notification channels:**
1. In-app notification popup/history.
2. Browser/OS external push notification.

**Private-message invariant:**
- Sender receives no message notification.
- Recipient receives the in-app notification.
- Recipient receives external push when subscribed.
- Notification delivery must not expose private message content to another account/device.

**Announcement invariant:**
- Only users included in the announcement audience receive the notification.
- Sender exclusion applies when the product rule says the author should not receive their own announcement notification.

**Reliability:**
- Failed push delivery must be retryable when appropriate.
- Expired subscriptions must be removed safely.
- Notification history must not be deleted merely because a popup is dismissed.

### 5.10 AI / Ask Nuvora

**Must:**
- Remain disabled until deployment controls are reviewed.
- Use permissioned server-side tools.
- Never allow arbitrary database queries from user prompts.
- Apply tenant and role authorization to every tool.
- Apply provider, cost, rate, logging, and data-retention controls before production enablement.

---

## 6. Non-Functional Requirements

### Security
- TLS in production.
- Strong production key material stored outside source control.
- Explicit CORS allowlist.
- Helmet/security headers.
- Rate limiting.
- Secure cookie/session configuration where cookies are used.
- Webhook signature verification.
- Input validation at trust boundaries.
- Least privilege.
- Audit logs for sensitive operations.
- No secrets in frontend bundles or Git history.

### Performance
- Common authenticated API requests should remain responsive under expected school load.
- Database queries must be indexed for high-cardinality foreign keys and common tenant filters.
- Background jobs must be used for slow/non-interactive work where appropriate.
- External-provider calls must have timeouts and controlled retries.

### Availability and resilience
- Health endpoints must distinguish application, database, and Redis degradation.
- Queue/worker failures must not silently lose critical financial or communication events.
- External service failures must degrade gracefully.
- Database backups and restore procedures must be tested before production.

### Observability
- Request IDs on API requests.
- Structured server logs.
- Metrics for requests, errors, rate limits, queues, and external integrations.
- Alerts for repeated payment, webhook, database, Redis, and worker failures.

### Maintainability
- Domain logic remains in services rather than duplicated across controllers/pages.
- Database changes use reviewed Prisma migrations.
- CI remains mandatory for pull requests.
- Tests cover security boundaries and critical workflows.

---

## 7. Software Quality Gates

The repository currently has automated backend and frontend CI. The workflow installs dependencies, generates Prisma Client, validates the schema, deploys migrations, seeds the CI database, runs backend tests/security tests, lints the frontend, and builds the frontend. fileciteturn297file0

### Required pre-release gates

- [ ] Backend unit/integration tests pass.
- [ ] Security tests pass.
- [ ] Frontend lint passes.
- [ ] Frontend production build passes.
- [ ] Prisma schema validation passes.
- [ ] All committed migrations apply cleanly to a fresh database.
- [ ] Production migration rehearsal succeeds on a database snapshot.
- [ ] Cross-tenant authorization tests pass.
- [ ] Role-boundary tests pass.
- [ ] Payment idempotency/replay tests pass.
- [ ] Webhook signature tests pass.
- [ ] Notification recipient/sender tests pass.
- [ ] External push delivery has a failure/retry test.
- [ ] Admission-to-enrollment workflow passes end-to-end.
- [ ] Backup restore test passes.
- [ ] No production secrets are present in repository history or frontend artifacts.

---

## 8. Standard Software Checkup Findings

### Confirmed strengths from repository inspection

1. **Security middleware is present.** The API uses CORS, Helmet, compression, request IDs, API rate limiting, origin locking, centralized error handling, and structured logging. fileciteturn291file0
2. **Authentication dependencies and controls are substantial.** The backend includes bcrypt, JWT, express-validator/Zod, rate limiting, Redis, Redlock, and security-test tooling. fileciteturn290file0
3. **Rate limiting is deliberately separated by authentication, IP, refresh, public workflows, and general API traffic.** fileciteturn295file0
4. **CI covers both backend and frontend quality gates.** fileciteturn297file0
5. **The data model contains explicit school, role, session, refresh-token, message, notification, audit-log, and profile relationships.** fileciteturn292file0
6. **Notification delivery has recently been hardened around recipient-only behavior.** The latest commits specifically address endpoint ownership and sender/recipient filtering.
7. **The README explicitly documents multi-tenant security expectations and production checklist items.** fileciteturn293file0

### Remaining high-priority verification areas

These are **verification requirements, not claims that the repository currently fails them**:

| Area | Priority | Required verification |
|---|---|---|
| Cross-tenant authorization | P0 | Automated two-school API matrix |
| Payment idempotency | P0 | Replay and concurrency tests |
| Webhook security | P0 | Signature, replay, malformed payload tests |
| Admission/payment activation | P0 | Full end-to-end state-machine test |
| Authentication/session security | P0 | Expiry, revocation, rotation, recovery tests |
| Notification delivery | P0 | Recipient/sender + retry + multi-device tests |
| Database migrations | P0 | Fresh DB + production rehearsal |
| Secrets | P0 | Repository/history/frontend bundle scan |
| Backup/restore | P0 | Restore rehearsal with measured RTO/RPO |
| Observability | P1 | Alerts, dashboards, actionable logs |
| Queue reliability | P1 | Retry/dead-letter/recovery tests |
| External integrations | P1 | Timeout, retry, circuit-breaker, replay tests |
| Frontend E2E | P1 | Browser tests for critical workflows |
| Accessibility | P1 | Keyboard, focus, labels, contrast, screen-reader pass |
| Performance/load | P1 | Representative concurrent-user load test |
| Dependency hygiene | P1 | Lockfile audit and update policy |
| Documentation | P1 | Deployment/runbook/disaster-recovery docs |

---

## 9. Critical End-to-End Test Matrix

### Authentication
- Login success/failure
- Account lock/rate limit
- Session refresh
- Logout
- Revoked session
- Password change/recovery
- Multiple browser tabs

### Tenant security
- School A → School A resource: allowed when authorized
- School A → School B resource: denied
- Admin → unauthorized resource: denied
- Parent → unrelated child: denied
- Student → another student: denied
- Platform admin → school resources: explicitly authorized only where intended

### Admissions
- Application creation
- Admin review
- Approval
- Enrollment
- Duplicate enrollment prevention
- Exam/CBT assignment
- Result synchronization
- Pass/fail handling
- Payment gate
- Activation
- Parent communication

### Finance
- Fee creation
- Quantity-based extra fee
- Invoice/payment attempt
- Successful payment
- Failed payment
- Webhook replay
- Concurrent webhook delivery
- Receipt creation
- Student/account activation after verified payment
- Cross-school financial isolation

### Communication
- Announcement audience targeting
- Sender exclusion
- Direct message
- Voice note
- Recipient-only internal popup
- Recipient-only external push
- Multiple devices
- Expired push subscription
- Notification deletion

### Operations
- Database outage
- Redis outage
- Queue outage
- External provider timeout
- Provider malformed response
- Application restart during pending work
- Worker restart during pending job

---

## 10. Release Strategy

### Phase 1 — Verification freeze
Freeze new features temporarily. Run the full quality/security matrix and document failures.

### Phase 2 — P0 remediation
Fix only security, data-integrity, payment, authentication, tenant-isolation, migration, and critical-notification issues.

### Phase 3 — Staging rehearsal
Deploy the exact production build and migrations to staging. Test realistic school data and external providers in sandbox mode.

### Phase 4 — Production readiness review
Verify secrets, domains, TLS, database backups, Redis, workers, monitoring, alerts, webhook endpoints, CORS, rate limits, and rollback procedures.

### Phase 5 — Controlled launch
Start with a limited school/user cohort. Monitor errors, payment events, queue depth, latency, and notification delivery before broader rollout.

---

## 11. Rollback Requirements

Every production release must have:

- A known previous application version.
- A database backup/snapshot before destructive migrations.
- A documented rollback/forward-fix plan.
- Migration compatibility reviewed before deployment.
- A way to disable external integrations independently where possible.
- A way to disable AI without disabling the core platform.

---

## 12. Success Metrics

### Reliability
- API error rate
- Background job failure rate
- Payment webhook failure/replay rate
- Notification delivery failure rate
- Database/Redis availability

### Performance
- API p50/p95 latency
- Page load/build health
- Database query latency
- Queue wait time

### Product usage
- Active schools
- Active staff/teachers/parents/students
- Successful admissions
- Successful payments
- Message/announcement delivery

### Support quality
- Critical incidents per release
- Mean time to detection
- Mean time to recovery
- Repeat incident rate

---

## 13. Definition of Done

A Petra feature is considered production-ready only when:

1. The complete user journey works through the UI.
2. The underlying API enforces the same business rule independently.
3. Unauthorized direct API requests fail safely.
4. Tenant boundaries are tested.
5. Data writes are validated and idempotent where needed.
6. Errors are observable and actionable.
7. Critical paths have automated tests.
8. Database changes have migrations.
9. Documentation is updated.
10. CI passes.
11. Production configuration is verified.
12. Rollback/recovery behavior is understood.

---

## 14. Current Assessment

**Overall engineering posture:** strong active-development foundation with several production-grade controls already present, but not yet sufficient to declare production readiness solely from repository inspection.

The most important next step is not adding random features. It is executing the P0 verification matrix above against the real running system, especially tenant isolation, authentication/session lifecycle, financial idempotency, webhook security, admission/payment activation, notification delivery, migrations, backups, and disaster recovery.

This document should be treated as the baseline PRD and production-readiness checklist for future Petra releases.
