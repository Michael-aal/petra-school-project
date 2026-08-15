# Changes made — 2026-08-15

## Build reliability

- Corrected the relative imports in the solution index and navigation component.
- Replaced the standalone simulated school-fees page with a redirect to the authenticated parent-fees portal.

## Payment safety

- Removed hard-coded learner details, random success/failure behaviour, and client-side payment confirmation.
- Payments now enter through the existing parent-fees flow, which initializes a Paystack checkout session through the backend and records success only after Paystack webhook verification.

## Staff-invitation isolation

- Added an optional `schoolId` and school relation to staff invitations.
- Added a migration that backfills invitations created by an identifiable issuing user, adds the foreign key and indexes, and makes invitation-email uniqueness school-specific.
- Scoped invitation listing, creation, revocation, and regeneration to the current school.
- Required a valid school context and principal-level access for staff invitation and pending-staff endpoints.
- Staff activation now prefers the invitation's stored school, avoiding reliance on the issuing user's later profile changes.

## Verification

- `npm run build` (frontend): passed.
- `npm run lint` (frontend): still reports 57 pre-existing errors and 9 warnings outside this change set; those need a separate cleanup pass.
- `npm test` (backend): passed (4/4 tests).
- Prisma schema validation could not run because Prisma's engine download endpoint was unavailable from this environment.

## Deployment note

Apply the Prisma migration before deploying the backend:

```bash
cd backend
npx prisma migrate deploy
```
