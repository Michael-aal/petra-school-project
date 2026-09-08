import jwt from "jsonwebtoken";

export const generateToken = (payload = {}) => {
  const normalizedPayload = {
    ...payload,
    id: payload?.id ?? payload?.userId ?? payload?.sub,
    userId: payload?.userId ?? payload?.id ?? payload?.sub,
    sub: payload?.sub ?? payload?.id ?? payload?.userId,
  };

  const privateKey = String(process.env.JWT_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!privateKey) throw new Error("JWT_PRIVATE_KEY is not configured.");
  return jwt.sign(normalizedPayload, privateKey, {
    algorithm: "RS256",
    keyid: process.env.JWT_KEY_ID || "petra-2026",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};
