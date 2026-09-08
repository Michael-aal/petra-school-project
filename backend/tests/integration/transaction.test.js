import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../config/db.js";
import { financeService } from "../../services/financeService.js";

test("payment creation rejects an invalid fee without persisting a payment", { skip: !process.env.RUN_INTEGRATION_TESTS }, async () => {
  const before = await prisma.payment.count();
  await assert.rejects(
    financeService.createPayment(
      { id: "integration-user", schoolId: 1, email: "integration@example.com" },
      { studentId: "student-not-found", studentFeeId: "fee-not-found" },
    ),
    (error) => [400, 404].includes(error.statusCode),
  );
  assert.equal(await prisma.payment.count(), before);
});
