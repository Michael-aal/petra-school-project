const isLocalDevelopmentOrigin = (origin) => {
  try {
    const normalized = String(origin || "").trim().replace(/\/+$/, "");
    const { hostname } = new URL(normalized);
    return ["localhost", "127.0.0.1", "::1"].includes(hostname) || hostname.endsWith(".localhost");
  } catch {
    return false;
  }
};

const isDevelopmentLocalOrigin = (origin) => {
  return isLocalDevelopmentOrigin(origin) && process.env.NODE_ENV !== "production";
};

export const originLock = (req, res, next) => {
  if (req.path === "/healthz" || req.path === "/readyz") return next();

  const origin = String(req.get("origin") || "").trim().replace(/\/+$/, "");
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
