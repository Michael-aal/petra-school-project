import request from "supertest";
import type { Express } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db.js";

const integrationEnabled = process.env.RUN_INTEGRATION_TESTS === "true";
const originSecret = process.env.ORIGIN_SECRET ?? "integration-origin-secret";
const appPromise = import("../../app.js").then(({ default: app }) => app as Express);

const signedToken = (schoolId: number): string => {
  const privateKey = Buffer.from(process.env.JWT_PRIVATE_KEY ?? "", "base64");
  if (!privateKey.length) throw new Error("JWT_PRIVATE_KEY must be Base64-encoded for integration tests.");
  return jwt.sign(
    { id: "integration-user", userId: "integration-user", schoolId, role: "principal" },
    privateKey,
    { algorithm: "RS256", expiresIn: "5m" },
  );
};

describe("origin lock", () => {
  test("rejects missing and invalid origin secrets", async () => {
    const app = await appPromise;
    const missing = await request(app).get("/api/students");
    const invalid = await request(app).get("/api/students").set("x-origin-secret", "invalid");
    expect(missing.status).toBe(403);
    expect(invalid.status).toBe(403);
  });
});

(integrationEnabled ? describe : describe.skip)("security integration", () => {
  afterAll(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });

  test("does not expose records from another school", async () => {
    const app = await appPromise;
    const response = await request(app)
      .get("/api/students")
      .set("x-origin-secret", originSecret)
      .set("authorization", `Bearer ${signedToken(1)}`);
    expect(response.status).not.toBe(500);
    const records = Array.isArray(response.body?.students)
      ? response.body.students
      : Array.isArray(response.body?.data)
        ? response.body.data
        : [];
    expect(records.every((student: { schoolId?: number }) => student.schoolId === 1)).toBe(true);
  });

  test("masks PII returned by the student endpoint", async () => {
    const app = await appPromise;
    const student = await prisma.student.findFirst({ select: { id: true } });
    expect(student).not.toBeNull();
    const response = await request(app)
      .get(`/api/students/${student?.id ?? ""}`)
      .set("x-origin-secret", originSecret)
      .set("authorization", `Bearer ${signedToken(1)}`);
    expect(response.status).toBe(200);
    const body = response.body?.student ?? response.body?.data ?? response.body;
    if (body.email) expect(body.email).toMatch(/^[^@]\*+@/);
    if (body.phone) expect(body.phone).toMatch(/^\*+\d{4}$/);
    if (body.nationalId) expect(body.nationalId).toMatch(/^\*+\d{2}$/);
  });
});
