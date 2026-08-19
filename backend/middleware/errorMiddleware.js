import { logger } from "../utils/logger.js";

export const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || res.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  logger.error("request failed", {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message: err.message,
    stack: isProduction ? undefined : err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || "Server error",
    errors: err.details ? [err.details] : [],
    ...(isProduction ? {} : { stack: err.stack }),
  });
};
