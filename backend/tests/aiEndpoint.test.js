import test from "node:test";
import assert from "node:assert/strict";
import { handleAIQuery } from "../ai/orchestrator.js";
import { prisma, runWithoutSchoolContext } from "../config/db.js";

// Fetch existing school and sample users
const existingSchool = await runWithoutSchoolContext(() => prisma.school.findFirst({ select: { id: true } })).catch(() => null);
const schoolId = existingSchool?.id || 1;

test("AI Endpoint Logic - Super Admin / Principal query executes smoothly", async () => {
  const user = {
    id: "admin-test-id",
    role: "principal",
    schoolId,
    fullName: "Principal Test",
  };

  const response = await handleAIQuery({
    user,
    message: "How is attendance this week?",
    schoolId,
  });

  assert.equal(response.success, true);
  assert.ok(typeof response.answer === "string");
  assert.ok(response.toolsUsed.includes("getAttendanceSummary"));
});

test("AI Endpoint Logic - Parent with no linked child receives administrator message", async () => {
  const user = {
    id: "parent-no-child-id",
    role: "parent",
    schoolId,
    fullName: "Parent Test",
  };

  const response = await handleAIQuery({
    user,
    message: "How has my child's attendance changed this term?",
    schoolId,
  });

  assert.equal(response.statusCode, 404);
  assert.match(response.answer, /No student is currently linked to your account/i);
});

test("AI Endpoint Logic - Teacher asking for school fees is blocked", async () => {
  const teacherUser = {
    id: "teacher-test-id",
    role: "teacher",
    schoolId,
    fullName: "Teacher Test",
  };

  const response = await handleAIQuery({
    user: teacherUser,
    message: "How much in school fees is currently outstanding?",
    schoolId,
  });

  // Blocked either through approved tools filtering or through 403 server-side rejection
  if (response.success) {
    assert.ok(!response.toolsUsed.includes("getFeeSummary"));
  } else {
    assert.equal(response.statusCode, 403);
  }
});
