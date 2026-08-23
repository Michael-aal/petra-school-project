import test from "node:test";
import assert from "node:assert/strict";
import { scopeTenantData, scopeWhere } from "../config/db.js";
import { assertSchoolAccess } from "../utils/authorization.js";
import { canUseAITool } from "../ai/aiPermissions.js";

test("tenant writes override an injected schoolId", () => {
  assert.equal(scopeTenantData({ schoolId: 99, name: "record" }, 12).schoolId, 12);
  assert.deepEqual(scopeWhere({ id: "record" }, 12), { AND: [{ id: "record" }, { schoolId: 12 }] });
});

test("tenant writes reject nested school relation changes", () => {
  assert.throws(() => scopeTenantData({ school: { connect: { id: 99 } } }, 12), /Nested school relation writes/);
});

test("non-super-admins cannot operate in another school", () => {
  assert.throws(() => assertSchoolAccess({ id: "user-1", role: "principal", schoolId: 12 }, 99), /Access denied/);
});

test("AI policy keeps parent scope narrow", async () => {
  assert.equal(await canUseAITool({ id: "parent-1", role: "parent" }, "student.results"), true);
  assert.equal(await canUseAITool({ id: "parent-1", role: "parent" }, "finance.summary"), false);
  assert.equal(await canUseAITool({ id: "student-1", role: "student" }, "attendance.summary"), false);
});
