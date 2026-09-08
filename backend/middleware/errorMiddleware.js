import { logger } from "../utils/logger.js";

export const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const prismaStatus = {
    P2002: 409,
    P2025: 404,
    P2003: 409,
    P2034: 409,
  };
  const statusCode = err.statusCode || prismaStatus[err.code] || (res.statusCode >= 400 ? res.statusCode : 500);
  const isProduction = process.env.NODE_ENV === "production";

  logger.error("request failed", {
    method: req.method,
    path: req.originalUrl,
    requestId: req.requestId,
    statusCode,
    message: err.message,
    stack: isProduction ? undefined : err.stack,
  });

  const safeMessage = isProduction
    ? (statusCode >= 500 ? "Internal server error" : (statusCode === 409 ? "The request conflicts with existing data" : err.statusCode ? err.message : "Request could not be completed"))
    : (err.message || "Server error");
  res.status(statusCode).json({
    success: false,
    requestId: req.requestId,
    message: safeMessage,
    errors: isProduction ? [] : (err.details ? [err.details] : []),
    ...(isProduction ? {} : { stack: err.stack }),
  });
};
