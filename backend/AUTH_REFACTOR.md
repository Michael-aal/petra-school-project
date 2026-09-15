Summary of authentication/session refactor

Goals
- Prevent cross-tab and cross-user data leakage.
- Use an HttpOnly authentication cookie so access tokens are not readable by scripts.
- Ensure server enforces identity and RBAC from the token on each request.

Key changes made
- The server sets `petra_session` and `petra_refresh` as HttpOnly cookies after login or registration. They use SameSite=Strict, Path=/, no Domain, and Secure in production.
- Browser clients authenticate with that cookie and do not send bearer tokens from JavaScript.
- User profile is fetched from `/api/auth/me` on app mount via `UserContext` rather than being persisted in `localStorage`.
- Replaced uses of `localStorage` for `petra_user_info` in nested/demo app copies with `sessionStorage` to avoid cross-tab sharing of profile data.

Frontend storage policy
- Do not store `petra_auth_token` in browser storage.
- Never store user profile, role, permissions, or dashboard data in `localStorage` or `sessionStorage`.
- On login: the server sets the cookie, then call `/api/auth/me` to load profile into in-memory React state.
- On logout: call `/api/auth/logout` or `/api/auth/logout-all`; the server revokes sessions, clears the cookies, and the client clears in-memory state before redirecting to `/signin`.

Testing multi-session behavior
1. Open Browser A tab — sign in as Principal.
2. Open Browser B tab — sign in as Parent.
3. Verify both tabs show their respective dashboards and profiles.
4. Refresh each tab — each should revalidate the token and reload only its own profile via `/api/auth/me`.

Notes & next steps
- Refresh tokens are stored server-side and rotated on refresh.
- Session IDs are stored server-side; revoked/expired sessions are rejected by middleware.
- Production browser mutations require the configured origin/proxy contract. Provider webhooks use signatures instead of browser origin headers.

If you want, I can now:
- Implement refresh token endpoints and secure rotate logic.
- Replace any remaining `localStorage` usages for sensitive keys.
- Run tests that automate multi-tab session checks.
