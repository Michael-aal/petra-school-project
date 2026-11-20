import crypto from "node:crypto";
import { env } from "./env.js";

const secret = env.JWT_PRIVATE_KEY;
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const signature = (payload) => crypto.createHmac("sha256", secret).update(payload).digest("base64url");

export const createApplicationLinkToken = ({ schoolId, type }) => {
  const normalizedType = type === "student" ? "student" : type === "teacher" ? "teacher" : null;
  const id = Number(schoolId);
  if (!normalizedType || !Number.isInteger(id) || id <= 0) throw new Error("Invalid application link context.");
  const payload = encode({ schoolId: id, type: normalizedType, version: 1 });
  return `${payload}.${signature(payload)}`;
};

export const verifyApplicationLinkToken = (token, expectedType = null) => {
  try {
    const [payload, suppliedSignature, extra] = String(token || "").split(".");
    if (!payload || !suppliedSignature || extra) return null;
    const expectedSignature = signature(payload);
    const left = Buffer.from(suppliedSignature);
    const right = Buffer.from(expectedSignature);
    if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (data.version !== 1 || !Number.isInteger(data.schoolId) || data.schoolId <= 0) return null;
    if (!["student", "teacher"].includes(data.type)) return null;
    if (expectedType && data.type !== expectedType) return null;
    return data;
  } catch {
    return null;
  }
};
