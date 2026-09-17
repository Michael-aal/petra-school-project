const PRIMARY_PRODUCTION_FRONTEND_ORIGIN = "https://petra-school-project.vercel.app";
const DEFAULT_PRODUCTION_FRONTEND_ORIGIN = "https://petra-school-project-b6b77wv9c-michael-aals-projects.vercel.app";
// Petra's project deployments use either the canonical domain or a generated
// Vercel deployment under the same project prefix. Other Vercel projects remain blocked.
const PETRA_VERCEL_ORIGIN = /^https:\/\/petra-school-project(?:-[a-z0-9-]+)?\.vercel\.app$/i;

const isLocalDevelopmentOrigin = (origin) => {
  try {
    const normalized = String(origin || "").trim().replace(/\/+$/, "");
    const { hostname } = new URL(normalized);
    return ["localhost", "127.0.0.1", "::1"].includes(hostname) || hostname.endsWith(".localhost");
  } catch {
    return false;
  }
};

const isDevelopmentLocalOrigin = (origin) =>
  isLocalDevelopmentOrigin(origin) && process.env.NODE_ENV !== "production";

const isPetraVercelOrigin = (origin) => {
  const normalizedOrigin = String(origin || "").trim().replace(/\/+$/, "");
  return normalizedOrigin === PRIMARY_PRODUCTION_FRONTEND_ORIGIN || PETRA_VERCEL_ORIGIN.test(normalizedOrigin);
};

const getAllowedOrigins = () => [
  process.env.CORS_ORIGIN,
  process.env.CLIENT_URL,
  process.env.PUBLIC_FRONTEND_ORIGIN,
  PRIMARY_PRODUCTION_FRONTEND_ORIGIN,
  DEFAULT_PRODUCTION_FRONTEND_ORIGIN,
].filter(Boolean).map((value) => String(value).trim().replace(/\/+$/, ""));

const isLocalLoadTestRequest = (req) => {
  if (process.env.NODE_ENV === "production") return false;
  if (String(process.env.LOAD_TEST_MODE || "").toLowerCase() !== "true") return false;
  const origin = String(req.get("origin") || "").trim().replace(/\/+$/, "");
  return isLocalDevelopmentOrigin(origin) && req.get("x-petra-load-test") === "1";
};

const PUBLIC_AUTH_NO_ORIGIN_PATHS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/parent/register",
  "/auth/staff/activate",
]);

const isProtectedAuthPath = (path) =>
  path === "/auth/me" ||
  path === "/auth/refresh" ||
  path === "/auth/profile" ||
  path === "/auth/change-password" ||
  path === "/auth/revoke" ||
  path === "/auth/logout" ||
  path === "/auth/logout-all" ||
  path === "/auth/account" ||
  path === "/auth/parent/link-child" ||
  path === "/auth/select-school" ||
  path === "/auth/staff/pending" ||
  path === "/auth/staff/invitations" ||
  path.startsWith("/auth/staff/invitations/") ||
  path === "/auth/staff/teachers" ||
  path.startsWith("/auth/staff/teachers/");

export const originLock = (req, res, next) => {
  if (["/health", "/healthz", "/readyz", "/paystack/webhook", "/classmarker/webhook"].includes(req.path)) return next();
  if (isLocalLoadTestRequest(req)) return next();

  const origin = String(req.get("origin") || "").trim().replace(/\/+$/, "");
  if (isDevelopmentLocalOrigin(origin)) return next();

  if (origin) {
    const allowedOrigins = getAllowedOrigins();
    if (!allowedOrigins.includes(origin) && !isPetraVercelOrigin(origin)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    return next();
  }

  // Public credential/bootstrap endpoints do not rely on a browser cookie and
  // may arrive without Origin when Vercel proxies /api/* to Render. CORS still
  // controls browser cross-origin access, while rate limiting protects these
  // public endpoints from abuse.
  if (PUBLIC_AUTH_NO_ORIGIN_PATHS.has(req.path)) return next();

  // Same-origin browser GETs such as /api/auth/me may legitimately omit the
  // Origin header. These endpoints have their own authentication/authorization
  // middleware, so the origin lock must not reject them before auth can run.
  // Vercel's /api/* rewrite can also remove the browser Origin at the Render
  // boundary, so treating these protected auth routes as server-to-server
  // traffic creates a false 403.
  if (isProtectedAuthPath(req.path)) return next();

  // Server-to-server requests without a browser Origin must prove knowledge
  // of the private origin secret. Browser requests never need this secret.
  const configured = String(process.env.ORIGIN_SECRET || "");
  const supplied = String(req.get("x-origin-secret") || "");
  if (!configured || supplied.length !== configured.length) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  let mismatch = 0;
  for (let index = 0; index < configured.length; index += 1) {
    mismatch |= configured.charCodeAt(index) ^ supplied.charCodeAt(index);
  }
  if (mismatch !== 0) return res.status(403).json({ success: false, message: "Forbidden" });
  return next();
};

export const enforceOriginLock = originLock;
