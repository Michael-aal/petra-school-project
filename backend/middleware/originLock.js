const isLocalDevelopmentOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);
    return ["localhost", "127.0.0.1", "::1"].includes(hostname) || hostname.endsWith(".localhost");
  } catch {
    return false;
  }
};

const isDevelopmentLocalOrigin = (origin) => {
  return process.env.NODE_ENV === "development" &&
    isLocalDevelopmentOrigin(origin);
};

export const originLock = (req, res, next) => {
  console.log("[originLock DEBUG]", {
    origin: req.get("origin"),
    nodeEnv: process.env.NODE_ENV,
    path: req.path,
    hasOriginSecret: Boolean(req.get("x-origin-secret")),
  });

  if (req.path === "/healthz" || req.path === "/readyz") return next();

  const origin = String(req.get("origin") || "");
if (isDevelopmentLocalOrigin(origin)) return next();

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
