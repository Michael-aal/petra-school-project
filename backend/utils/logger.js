import { AsyncLocalStorage } from "node:async_hooks";

const requestContext = new AsyncLocalStorage();

const formatMessage = (level, message, meta = {}) => {
  const requestId = requestContext.getStore();
  const base = {
    level,
    message,
    ...(requestId ? { requestId } : {}),
    ...(Object.keys(meta).length ? { meta } : {}),
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
