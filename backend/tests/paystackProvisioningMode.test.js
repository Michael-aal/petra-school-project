import test from "node:test";
import assert from "node:assert/strict";
import {
  isPaystackTestMode,
  shouldProvisionSettlementSubaccount,
  isDvaFeatureAccessDenied,
  shouldGracefullyPendDvaProvisioning,
} from "../utils/paystackProvisioningMode.js";

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

test("DVA business-access errors are classified without exposing provider secrets", () => {
  const error = { providerStatus: 403, providerMessage: "Dedicated NUBAN is not available for your business" };
  assert.equal(isDvaFeatureAccessDenied(error), true);
  assert.equal(shouldGracefullyPendDvaProvisioning(error, "sk_test_example"), true);
  assert.equal(shouldGracefullyPendDvaProvisioning(error, "sk_live_example"), false);
});

test("non-DVA or non-403 failures are not silently downgraded", () => {
  assert.equal(isDvaFeatureAccessDenied({ providerStatus: 400, providerMessage: "Invalid customer" }), false);
  assert.equal(isDvaFeatureAccessDenied({ providerStatus: 403, providerMessage: "Invalid API permission" }), false);
  assert.equal(shouldGracefullyPendDvaProvisioning({ providerStatus: 500, providerMessage: "Provider unavailable" }, "sk_test_example"), false);
});
