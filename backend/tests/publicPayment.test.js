import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateConfiguredFeeLines,
  financeService,
  resolveConfiguredPaymentAmount,
} from "../services/financeService.js";

test("configured public fee amount ignores a tampered client amount", () => {
  const amount = resolveConfiguredPaymentAmount({
    feeStructure: { amount: 25000 },
    requestedAmount: 1,
  });

  assert.equal(amount.toString(), "25000");
});

test("configured tuition options use administrator-defined amounts", () => {
  const partial = resolveConfiguredPaymentAmount({ feeStructure: { amount: 100000 }, requestedAmount: 1 });
  const full = resolveConfiguredPaymentAmount({ feeStructure: { amount: 200000 }, requestedAmount: 1 });

  assert.equal(partial.toString(), "100000");
  assert.equal(full.toString(), "200000");
});

test("invalid public Student Code is rejected", { skip: !process.env.RUN_INTEGRATION_TESTS }, async () => {
  await assert.rejects(
    financeService.getPublicStudentLookup({ studentCode: "INVALID-PUBLIC-STUDENT-CODE" }),
    (error) => error.statusCode === 404 && error.message === "Student Code not found",
  );
});

test("valid public Student Code returns safe student details and active configured fees", { skip: !process.env.RUN_INTEGRATION_TESTS }, async () => {
  const result = await financeService.getPublicStudentLookup({ studentCode: process.env.PUBLIC_PAYMENT_STUDENT_CODE });

  assert.ok(result.student.name);
  assert.ok(result.student.className);
  assert.ok(Array.isArray(result.feeStructures));
  assert.ok(result.feeStructures.every((fee) => fee.id && fee.name && Number(fee.amount) > 0));
  assert.equal(Object.hasOwn(result.student, "id"), false);
});

test("public fee lines calculate server totals and force non-quantity fees to one", () => {
  const lines = calculateConfiguredFeeLines({
    feeStructures: [
      { id: "uniform", amount: 8000, quantityRequired: true },
      { id: "application", amount: 15000, quantityRequired: false },
    ],
    requestedItems: [
      { feeStructureId: "uniform", quantity: 2 },
      { feeStructureId: "application", quantity: 9 },
    ],
  });

  assert.deepEqual(lines.map((line) => ({ quantity: line.quantity, total: line.lineTotal.toString() })), [
    { quantity: 2, total: "16000" },
    { quantity: 1, total: "15000" },
  ]);
});

test("public fee lines reject zero or negative quantity", () => {
  assert.throws(
    () => calculateConfiguredFeeLines({
      feeStructures: [{ id: "uniform", amount: 8000, quantityRequired: true }],
      requestedItems: [{ feeStructureId: "uniform", quantity: 0 }],
    }),
    (error) => error.statusCode === 400 && error.message === "Quantity must be at least 1",
  );
});