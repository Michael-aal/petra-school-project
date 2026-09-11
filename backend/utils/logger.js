import { AsyncLocalStorage } from "node:async_hooks";

const requestContext = new AsyncLocalStorage();
const REDACTED = "[REDACTED]";
const sensitiveKeys = new Set([
  "authorization",
  "password",
  "confirmpassword",
  "email",
  "phonenumber",
  "address",
  "nationalid",
]);

const sanitize = (value, key = "") => {
  if (sensitiveKeys.has(key.toLowerCase())) return REDACTED;
  if (Array.isArray(value)) return value.map((item) => sanitize(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [
      childKey,
      sanitize(childValue, childKey),
    ]));
  }
  return value;
};

const formatMessage = (level, message, meta = {}) => {
  const requestId = requestContext.getStore();
  const sanitizedMessage = message && typeof message === "object"
    ? sanitize(message)
    : message;
  const base = {
    level,
    message: sanitizedMessage,
    ...(requestId ? { requestId } : {}),
    ...(Object.keys(meta).length ? { meta: sanitize(meta) } : {}),
  };

  return base;
};

export const runWithRequestContext = (requestId, callback) =>
  requestContext.run(requestId, callback);

export const logger = {
  info: (message, meta) => console.log(JSON.stringify(formatMessage("info", message, meta))),
  warn: (message, meta) => console.warn(JSON.stringify(formatMessage("warn", message, meta))),
  error: (message, meta) => console.error(JSON.stringify(formatMessage("error", message, meta))),
};
