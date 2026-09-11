import jwt from "jsonwebtoken";
import { getJwtPrivateKey } from "./jwtKeys.js";

export const generateToken = (payload = {}) => {
  const normalizedPayload = {
    ...payload,
    id: payload?.id ?? payload?.userId ?? payload?.sub,
    userId: payload?.userId ?? payload?.id ?? payload?.sub,
    sub: payload?.sub ?? payload?.id ?? payload?.userId,
  };

  return jwt.sign(normalizedPayload, getJwtPrivateKey(), {
    algorithm: "RS256",
    keyid: process.env.JWT_KEY_ID || "petra-2026",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};
