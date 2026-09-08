import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";

test("parent fee access rejects an unrelated student", { skip: !process.env.RUN_INTEGRATION_TESTS }, async () => {
  const response = await request(app)
    .get("/api/finance/parent/fees")
    .query({ studentId: "student-not-linked-to-parent" });

  assert.equal(response.status, 401);
});
