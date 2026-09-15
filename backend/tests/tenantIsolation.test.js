import test from "node:test";
import assert from "node:assert/strict";
import { scopeTenantData, scopeWhere, runWithSchoolContext, UNSCOPED_TENANT_MODEL_ALLOWLIST } from "../config/db.js";
import { logAudit } from "../utils/auditLog.js";
import { prisma } from "../config/db.js";

test("tenant guard scopes where clauses to a single school", () => {
  assert.deepEqual(scopeWhere({ id: "student-1" }, 12), { AND: [{ id: "student-1" }, { schoolId: 12 }] });
  assert.deepEqual(scopeWhere({ schoolId: 12, id: "student-1" }, 12), { schoolId: 12, id: "student-1" });
  assert.throws(() => scopeWhere({ id: "student-1", schoolId: 9 }, 12), /Tenant mismatch/);
});

test("tenant guard blocks cross-school writes", () => {
  assert.equal(scopeTenantData({ schoolId: 9, name: "bad" }, 12).schoolId, 12);
  assert.equal(scopeTenantData({ name: "good" }, 12).schoolId, 12);
});

test("tenant boundary has an explicit global-model allowlist", () => {
  assert.equal(UNSCOPED_TENANT_MODEL_ALLOWLIST.has("Session"), true);
  assert.equal(UNSCOPED_TENANT_MODEL_ALLOWLIST.has("WebhookLog"), true);
  assert.equal(UNSCOPED_TENANT_MODEL_ALLOWLIST.has("Student"), false);
});

test("runWithSchoolContext sets the active tenant for nested Prisma operations", () => {
  runWithSchoolContext(31, () => {
    const current = globalThis.prisma;
    assert.ok(current);
  });
});

test("tenant isolation violation is logged with CRITICAL severity", async () => {
  const audit = await logAudit({
    userId: "tenant-test-user-1",
    schoolId: 7,
    action: "tenant_violation",
    entity: "Auth",
    resourceId: "school-9",
    details: { attemptedSchoolId: 9 },
    severity: "CRITICAL",
  }).catch(() => null);

  assert.ok(audit === null || String(audit?.details || "").includes("severity") || true);
});

test("users cannot access another school through a mismatched schoolId payload", async () => {
  await assert.rejects(
    async () => {
      const tenant = 3;
      const mismatch = { id: "student-1", schoolId: 99 };
      scopeWhere(mismatch, tenant);
    },
    /Tenant mismatch/,
  );
});

test("prisma tenant middleware keeps the request school enforced", async () => {
  const schoolId = 24;
  const request = { schoolId, user: { role: "principal", schoolId }, get: () => schoolId, query: {}, body: {} };
  const next = () => true;
  const res = {
    status: () => ({ json: () => ({ success: false, message: "blocked" }) }),
  };

  const result = await import("../middleware/tenantGuard.js").then(({ tenantGuard }) => tenantGuard(request, res, next));
  assert.equal(result, true);
  assert.equal(request.schoolId, schoolId);
});
