import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAdmissionEmailPayload,
  buildAdmissionFailureEmailPayload,
  buildAdmissionPaymentUrl,
} from "../services/emailService.js";
import { parseSchoolHeader } from "../middleware/authMiddleware.js";
import { buildQuizlabAssessmentPayload } from "../controllers/classMarkerController.js";
import { resolveSchoolId } from "../services/admissionService.js";
import { prisma } from "../config/db.js";

test("buildAdmissionPaymentUrl points the parent admission email at the public payment flow", () => {
  assert.equal(buildAdmissionPaymentUrl("https://demo.school.example/"), "https://demo.school.example/payment");
});

test("auth middleware accepts the selected x-school-id header as a valid numeric school context", () => {
  assert.equal(parseSchoolHeader("12"), 12);
  assert.equal(parseSchoolHeader("not-a-number"), null);
});

test("QuizLab ATS candidate payload uses the published test and applicant correlation fields", () => {
  const payload = buildQuizlabAssessmentPayload({ quizId: 31, candidateEmail: "student@example.com", applicantName: "Test Applicant", externalId: "APP-123" });
  assert.deepEqual(payload, { quiz_id: 31, candidate_email: "student@example.com", candidate_name: "Test Applicant", external_id: "APP-123" });
});

test("pass admission email includes result, student code, and payment details", () => {
  const payload = buildAdmissionEmailPayload({ school: { name: "Petra School" }, studentName: "Test Applicant", admissionCode: "ADM-TEST", paymentUrl: "https://school.example/payment", score: 4, percentage: 100 });
  assert.match(payload.text, /PASSED/);
  assert.match(payload.text, /Score: 4/);
  assert.match(payload.text, /Percentage: 100%/);
  assert.match(payload.text, /Student Code: ADM-TEST/);
  assert.match(payload.text, /school\.example\/payment/);
});

test("fail admission email excludes student code and payment details", () => {
  const payload = buildAdmissionFailureEmailPayload({ school: { name: "Petra School" }, studentName: "Test Applicant", score: 1, percentage: 25 });
  assert.match(payload.text, /FAILED/);
  assert.match(payload.text, /Score: 1/);
  assert.match(payload.text, /Percentage: 25%/);
  assert.doesNotMatch(payload.text, /Student Code|portal\/fees|payment/i);
});

test("resolveSchoolId prefers the authenticated user's school context over payload.schoolId", async () => {
  const originalFindUnique = prisma.school.findUnique;
  let calls = 0;
  prisma.school.findUnique = async () => { calls += 1; return { id: 5 }; };
  try {
    const schoolId = await resolveSchoolId(5, { schoolId: 6 });
    assert.equal(schoolId, 6);
    assert.equal(calls, 0);
  } finally { prisma.school.findUnique = originalFindUnique; }
});

test("resolveSchoolId rejects unauthenticated submissions when no explicit school context is provided", async () => {
  const originalFindUnique = prisma.school.findUnique;
  let calls = 0;
  prisma.school.findUnique = async () => { calls += 1; return { id: 7 }; };
  try {
    await assert.rejects(() => resolveSchoolId(null, null), /A valid school context is required for admission submission/);
    assert.equal(calls, 0);
  } finally { prisma.school.findUnique = originalFindUnique; }
});

test("resolveSchoolId accepts an explicit school context for unauthenticated public admission submissions", async () => {
  const originalFindUnique = prisma.school.findUnique;
  let calls = 0;
  prisma.school.findUnique = async ({ where }) => { calls += 1; if (where.id === 7) return { id: 7 }; return null; };
  try {
    const schoolId = await resolveSchoolId(7, null);
    assert.equal(schoolId, 7);
    assert.equal(calls, 1);
  } finally { prisma.school.findUnique = originalFindUnique; }
});
