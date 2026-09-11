import test from "node:test";
import assert from "node:assert/strict";
import { buildStudentCodeQueries } from "../services/parentAccessService.js";

test("Student Code lookup is school-scoped across Admission and Student fallback", () => {
  assert.deepEqual(buildStudentCodeQueries(" ADM-A ", 1), {
    admissionWhere: { admissionCode: "ADM-A", schoolId: 1 },
    studentWhere: { admissionNumber: "ADM-A", schoolId: 1 },
  });
});

test("Student Code lookup does not construct an unscoped school query", () => {
  const queries = buildStudentCodeQueries("ADM-A", 6);

  assert.equal(queries.admissionWhere.schoolId, 6);
  assert.equal(queries.studentWhere.schoolId, 6);
});

test("Student Code lookup preserves the exact code for authorization resolution", () => {
  const queries = buildStudentCodeQueries("ADM-5-EXACT", 5);

  assert.equal(queries.admissionWhere.admissionCode, "ADM-5-EXACT");
  assert.equal(queries.studentWhere.admissionNumber, "ADM-5-EXACT");
});
