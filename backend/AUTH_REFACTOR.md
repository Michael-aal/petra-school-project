Summary of authentication/session refactor

Goals
- Prevent cross-tab and cross-user data leakage.
- Use per-tab session storage for access tokens to allow multiple simultaneous sessions.
- Ensure server enforces identity and RBAC from the token on each request.

Key changes made
- Removed server-side setting of `petra_token` cookie in `backend/controllers/authController.js` (cookies are shared across tabs and prevented concurrent isolated sessions).
- `authMiddleware` continues to accept `Authorization: Bearer <token>` and falls back to cookie when present; prefer using the Authorization header from the frontend.
- Frontend `authApi` stores tokens in `sessionStorage` (per-tab) and no longer relies on cookies.
- User profile is fetched from `/api/auth/me` on app mount via `UserContext` rather than being persisted in `localStorage`.
- Replaced uses of `localStorage` for `petra_user_info` in nested/demo app copies with `sessionStorage` to avoid cross-tab sharing of profile data.

Frontend storage policy
- Only store `petra_auth_token` in `sessionStorage`.
- Never store user profile, role, permissions, or dashboard data in `localStorage` or `sessionStorage`.
- On login: persist token to `sessionStorage`, then call `/api/auth/me` to load profile into in-memory React state.
- On logout: clear token from `sessionStorage`, clear in-memory state, and redirect to `/signin`.

Testing multi-session behavior
1. Open Browser A tab — sign in as Principal.
2. Open Browser B tab — sign in as Parent.
3. Verify both tabs show their respective dashboards and profiles.
4. Refresh each tab — each should revalidate the token and reload only its own profile via `/api/auth/me`.

Notes & next steps
- Consider implementing rotating refresh tokens with secure storage server-side if long-lived sessions are required.
- Optionally add `jti` token identifiers and server-side session revocation list for logout invalidation.
- Audit any remaining copies or older builds (dist) that may still reference cookies/localStorage and update them.

If you want, I can now:
- Implement refresh token endpoints and secure rotate logic.
- Replace any remaining `localStorage` usages for sensitive keys.
- Run tests that automate multi-tab session checks.
