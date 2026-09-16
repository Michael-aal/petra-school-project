import test from "node:test";
import assert from "node:assert/strict";
import { isPaystackTestMode, shouldProvisionSettlementSubaccount } from "../utils/paystackProvisioningMode.js";

test("Paystack test keys use the sandbox provisioning path", () => {
  assert.equal(isPaystackTestMode("sk_test_example"), true);
  assert.equal(shouldProvisionSettlementSubaccount("sk_test_example"), false);
});

test("Paystack live keys keep real settlement subaccount provisioning", () => {
  assert.equal(isPaystackTestMode("sk_live_example"), false);
  assert.equal(shouldProvisionSettlementSubaccount("sk_live_example"), true);
});

test("missing Paystack keys do not silently enter test mode", () => {
  assert.equal(isPaystackTestMode(""), false);
  assert.equal(shouldProvisionSettlementSubaccount(""), true);
});
