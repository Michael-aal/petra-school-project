import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { paystackService } from "../services/paystackService.js";
import { normalizeIdempotencyKey, reconcilePaystackStatus } from "../services/financeService.js";
import { hashWebhookPayload, webhookLogModel } from "../models/webhookLogModel.js";

const integration = process.env.RUN_INTEGRATION_TESTS === "true";

test("Paystack webhook signatures use the configured HMAC secret", () => {
  const previous = process.env.PAYSTACK_SECRET_KEY;
  process.env.PAYSTACK_SECRET_KEY = "test-paystack-secret";
  const body = JSON.stringify({ event: "charge.success" });
  const signature = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(body).digest("hex");

  assert.equal(paystackService.verifySignature(body, signature), true);
  assert.equal(paystackService.verifySignature(body, `${signature.slice(0, -1)}0`), false);

  if (previous === undefined) delete process.env.PAYSTACK_SECRET_KEY;
  else process.env.PAYSTACK_SECRET_KEY = previous;
});

test("payment idempotency keys are normalized consistently", () => {
  assert.equal(normalizeIdempotencyKey("  payment-123  "), "payment-123");
  assert.equal(normalizeIdempotencyKey(""), null);
  assert.equal(normalizeIdempotencyKey(null), null);
});

test("reconciliation maps only provider-authoritative statuses", () => {
  assert.equal(reconcilePaystackStatus("success"), "Successful");
  assert.equal(reconcilePaystackStatus("failed"), "Failed");
  assert.equal(reconcilePaystackStatus("abandoned"), "Failed");
  assert.equal(reconcilePaystackStatus("pending"), "Processing");
});

test("webhook payload hashes are deterministic", () => {
  assert.equal(hashWebhookPayload("{}"), hashWebhookPayload(Buffer.from("{}")));
});

test("duplicate Paystack request IDs are rejected atomically", { skip: !integration }, async () => {
  const requestId = `test-${Date.now()}`;
  const first = await webhookLogModel.reserve({ provider: "paystack", requestId, rawBody: "{}" });
  const second = await webhookLogModel.reserve({ provider: "paystack", requestId, rawBody: "{}" });

  assert.ok(first);
  assert.equal(second, null);
  await webhookLogModel.release({ provider: "paystack", requestId });
});
