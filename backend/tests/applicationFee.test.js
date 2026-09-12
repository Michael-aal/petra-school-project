import test from "node:test";
import assert from "node:assert/strict";
import { resolveApplicationPaymentAmount } from "../services/financeService.js";

test("school-specific application fees remain distinct", () => {
  const schoolAApplicationFee = { amount: 15000 };
  const schoolBApplicationFee = { amount: 22500 };

  assert.equal(resolveApplicationPaymentAmount({ applicationFee: schoolAApplicationFee, requestedAmount: 1 }).toString(), "15000");
  assert.equal(resolveApplicationPaymentAmount({ applicationFee: schoolBApplicationFee, requestedAmount: 1 }).toString(), "22500");
});

test("application payments ignore an arbitrary client-supplied amount", () => {
  const amount = resolveApplicationPaymentAmount({ applicationFee: { amount: 18000 }, requestedAmount: 1 });

  assert.equal(amount.toString(), "18000");
});

test("normal payments retain their requested amount when no application fee is selected", () => {
  const amount = resolveApplicationPaymentAmount({ applicationFee: null, requestedAmount: 32000 });

  assert.equal(amount.toString(), "32000");
});