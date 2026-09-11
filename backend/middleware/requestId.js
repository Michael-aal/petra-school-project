import crypto from "node:crypto";
import { runWithRequestContext } from "../utils/logger.js";

export const requestId = (req, res, next) => {
  const incomingId = String(req.get("x-request-id") || "").trim();
  const id = incomingId && incomingId.length <= 128 ? incomingId : crypto.randomUUID();

  req.requestId = id;
  res.setHeader("x-request-id", id);
  return runWithRequestContext(id, next);
};
