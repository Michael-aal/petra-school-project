# Applicant-to-Admission Workflow Memo

**Date:** 2026-09-08
**Project:** Petra School

## Purpose

The applicant-to-admission workflow was connected using the existing Petra architecture, routes, backend services, Prisma models, Paystack integration, CBT integration, and email service. No duplicate frontend workflow was created, and no separate applicant code was introduced.

## Work Completed

### Frontend

- Registered the existing `Payment.jsx` screen at both `/Payment` and `/payment` in `App.jsx`.
- Updated `Payment.jsx` to use the existing finance API and Paystack payment initialization.
- Added linked-student selection and the configured application fee of `N15,000`.
- Stored the application payment state and selected student identifier for the next workflow step.
- Added a payment gate to `AdmissionForm.jsx`; users who have not completed the application fee are redirected to `/payment`.
- Kept the existing admission form payload and submission API, including parent, student, health, academic, and consent data.
- Connected successful admission submission to the existing CBT route using the returned applicant and assessment identifiers.
- Simplified `CbtPage.jsx` so it starts the configured assessment through `/api/assessments/start` and displays the returned QuizLab launch URL.

### Backend

- Preserved the existing admission, assessment, result-sync, enrollment, finance, Paystack, and Prisma service boundaries.
- Updated admission result handling to send a congratulations email when the applicant passes the configured cutoff.
- Updated the pass email to present the generated student/admission code and link to the payment flow.
- Added a failure email for applicants who do not meet the cutoff.
- Added deduplication keys for pass and failure emails so repeated result synchronization does not intentionally send duplicate messages.
- Kept school-specific processing and the existing admission/student creation logic in place.

## Validation Completed

- Frontend production build passed:

```text
cd Petra-Project && npm run build
✓ built in 968ms
```

- The updated frontend compiles successfully with Vite.
- The workflow changes were reviewed against the existing routes and backend service structure.

## Remaining Validation

A live end-to-end run still requires a configured development database, authenticated parent account, Paystack test credentials/webhook delivery, QuizLab/ClassMarker credentials, and SMTP configuration. Those integrations were not exercised against live external services in this environment.

Before production deployment, verify the complete sequence:

1. Pay application fee through Paystack test mode.
2. Open and submit the admission form.
3. Launch and complete the CBT assessment.
4. Synchronize the result and verify the configured cutoff.
5. Confirm exactly one pass or failure email is logged and delivered.
6. Confirm passed applicants are enrolled without duplicate student creation.
7. Confirm the payment and admission status shown to the parent matches the backend state.
