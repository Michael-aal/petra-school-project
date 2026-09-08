import pino from "pino";

export const logger = pino({
  redact: {
    paths: [
      "req.body.password",
      "req.body.email",
      "req.body.phone",
      "req.headers.authorization",
      "req.headers['x-origin-secret']",
    ],
    censor: "[REDACTED]",
  },
});
