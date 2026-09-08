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

export const enforceOriginLock = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  if (request.path === "/healthz" || request.path === "/readyz") {
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
