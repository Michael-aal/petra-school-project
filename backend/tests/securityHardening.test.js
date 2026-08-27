import test from "node:test";
import assert from "node:assert";
import { paystackService } from "../services/paystackService.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";
import { createHmac } from "crypto";

test("Security Hardening - Paystack verifySignature with timingSafeEqual", () => {
  process.env.PAYSTACK_SECRET_KEY = "test_secret_key";
  const body = JSON.stringify({ event: "charge.success", data: { id: 123 } });
  const validSig = createHmac("sha512", "test_secret_key").update(body).digest("hex");

  assert.strictEqual(paystackService.verifySignature(body, validSig), true);
  assert.strictEqual(paystackService.verifySignature(body, "invalid_signature"), false);
  assert.strictEqual(paystackService.verifySignature(body, ""), false);
  assert.strictEqual(paystackService.verifySignature(body, null), false);
});

test("Security Hardening - Rate Limiter Middleware blocks abusive requests", () => {
  const limiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 3,
    keyGenerator: () => "test_ip_key",
  });

  let blockedStatus = null;
  const mockReq = { ip: "127.0.0.1", originalUrl: "/test" };
  const mockRes = {
    setHeader: () => {},
    status: (code) => {
      blockedStatus = code;
      return {
        json: (data) => data,
      };
    },
  };
  let nextCalled = 0;
  const next = () => {
    nextCalled++;
  };

  limiter(mockReq, mockRes, next);
  limiter(mockReq, mockRes, next);
  limiter(mockReq, mockRes, next);
  assert.strictEqual(nextCalled, 3);

  limiter(mockReq, mockRes, next);
  assert.strictEqual(blockedStatus, 429);
  assert.strictEqual(nextCalled, 3);
});
