const formatMessage = (level, message, meta = {}) => {
  const base = {
    level,
    message,
    ...(Object.keys(meta).length ? { meta } : {}),
  };

  return base;
};

export const logger = {
  info: (message, meta) => console.log(JSON.stringify(formatMessage("info", message, meta))),
  warn: (message, meta) => console.warn(JSON.stringify(formatMessage("warn", message, meta))),
  error: (message, meta) => console.error(JSON.stringify(formatMessage("error", message, meta))),
};
