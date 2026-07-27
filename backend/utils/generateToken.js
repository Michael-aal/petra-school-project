import jwt from "jsonwebtoken";

export const generateToken = (payload = {}) => {
  const normalizedPayload = {
    ...payload,
    id: payload?.id ?? payload?.userId ?? payload?.sub,
    userId: payload?.userId ?? payload?.id ?? payload?.sub,
    sub: payload?.sub ?? payload?.id ?? payload?.userId,
  };

  return jwt.sign(normalizedPayload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};
