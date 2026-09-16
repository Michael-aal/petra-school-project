import test from "node:test";
import assert from "node:assert/strict";
import { originLock } from "../middleware/originLock.js";
import { authCookieOptions } from "../controllers/authController.js";

test("origin lock rejects an unapproved browser origin", () => {
  const previousOrigin = process.env.CORS_ORIGIN;
  const previousSecret = process.env.ORIGIN_SECRET;
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  process.env.CORS_ORIGIN = "https://petra.example";
  process.env.ORIGIN_SECRET = "proxy-secret";

  let status;
  const response = { status: (code) => { status = code; return { json: () => undefined }; } };
  originLock({ path: "/auth/login", get: (name) => name === "origin" ? "https://evil.example" : "proxy-secret" }, response, () => undefined);
  assert.equal(status, 403);

  process.env.CORS_ORIGIN = previousOrigin;
  process.env.ORIGIN_SECRET = previousSecret;
  process.env.NODE_ENV = previousNodeEnv;
});

test("origin lock allows Petra Vercel deployment origins", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  let passed = false;
  const response = { status: () => ({ json: () => undefined }) };
  originLock(
    {
      path: "/auth/login",
      get: (name) => name === "origin" ? "https://petra-school-project-new-build-abc123-michael-aals-projects.vercel.app" : "",
    },
    response,
    () => { passed = true; },
  );

  assert.equal(passed, true);
  process.env.NODE_ENV = previousNodeEnv;
});

test("session cookie remains HttpOnly and does not expose a Domain", () => {
  assert.equal(authCookieOptions.httpOnly, true);
  assert.equal(authCookieOptions.sameSite, "strict");
  assert.equal(authCookieOptions.path, "/");
  assert.equal(Object.hasOwn(authCookieOptions, "domain"), false);
});
