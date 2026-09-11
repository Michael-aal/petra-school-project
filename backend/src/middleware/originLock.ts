import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const requiredSecret = (): Buffer => {
  const configured = process.env.ORIGIN_SECRET;
  if (!configured) {
    throw new Error("ORIGIN_SECRET is required before the application can start.");
  }
  return Buffer.from(configured, "utf8");
};

const originSecret = requiredSecret();

const isLocalDevelopmentOrigin = (origin: string): boolean => {
  try {
    const { hostname } = new URL(origin);
    return ["localhost", "127.0.0.1", "::1"].includes(hostname) || hostname.endsWith(".localhost");
  } catch {
    return false;
  }
};

const isDevelopmentLocalAuthRoute = (request: Request, origin: string): boolean => {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  if (!isLocalDevelopmentOrigin(origin)) {
    return false;
  }

  return [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/parent/register",
    "/api/auth/me",
    "/api/auth/logout",
  ].includes(request.path);
};

export const enforceOriginLock = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  if (request.path === "/healthz" || request.path === "/readyz") {
    next();
    return;
  }

  const origin = String(request.get("origin") || "");
  if (isDevelopmentLocalAuthRoute(request, origin)) {
    next();
    return;
  }

  const supplied = request.get("x-origin-secret");
  if (!supplied) {
    response.status(403).json({ success: false, message: "Forbidden" });
    return;
  }

  const suppliedSecret = Buffer.from(supplied, "utf8");
  if (
    suppliedSecret.length !== originSecret.length ||
    !timingSafeEqual(suppliedSecret, originSecret)
  ) {
    response.status(403).json({ success: false, message: "Forbidden" });
    return;
  }

  next();
};
