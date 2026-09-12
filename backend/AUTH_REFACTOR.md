Summary of authentication/session refactor

Goals
- Prevent cross-tab and cross-user data leakage.
- Use an HttpOnly authentication cookie so access tokens are not readable by scripts.
- Ensure server enforces identity and RBAC from the token on each request.

Key changes made
- The server sets `petra_token` as an HttpOnly, SameSite=Lax cookie after login or registration.
- Browser clients authenticate with that cookie and do not send bearer tokens from JavaScript.
- User profile is fetched from `/api/auth/me` on app mount via `UserContext` rather than being persisted in `localStorage`.
- Replaced uses of `localStorage` for `petra_user_info` in nested/demo app copies with `sessionStorage` to avoid cross-tab sharing of profile data.

Frontend storage policy
- Do not store `petra_auth_token` in browser storage.
- Never store user profile, role, permissions, or dashboard data in `localStorage` or `sessionStorage`.
- On login: the server sets the cookie, then call `/api/auth/me` to load profile into in-memory React state.
- On logout: clear the cookie server-side, clear in-memory state, and redirect to `/signin`.

Testing multi-session behavior
1. Open Browser A tab — sign in as Principal.
2. Open Browser B tab — sign in as Parent.
3. Verify both tabs show their respective dashboards and profiles.
4. Refresh each tab — each should revalidate the token and reload only its own profile via `/api/auth/me`.

Notes & next steps
- Implement rotating refresh tokens with secure server-side storage if long-lived sessions are required.
- Add `jti` token identifiers and server-side session revocation for immediate logout invalidation.
- Audit any remaining copies or older builds (dist) that may still reference cookies/localStorage and update them.

If you want, I can now:
- Implement refresh token endpoints and secure rotate logic.
- Replace any remaining `localStorage` usages for sensitive keys.
- Run tests that automate multi-tab session checks.
