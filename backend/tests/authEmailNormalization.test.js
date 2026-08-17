import test from "node:test";
import assert from "node:assert/strict";

import { normalizeEmail } from "../utils/emailUtils.js";
import { comparePassword } from "../utils/comparePassword.js";
import { hashPassword } from "../utils/hashPassword.js";

test("normalizeEmail trims whitespace and lowercases the address", () => {
  assert.equal(normalizeEmail("  User@Example.COM  "), "user@example.com");
  assert.equal(normalizeEmail("PAUL@school.org"), "paul@school.org");
  assert.equal(normalizeEmail(undefined), "");
  assert.equal(normalizeEmail("   "), "");
});

test("normalizeEmail keeps the same address as the registered/stored form", () => {
  // Registration stores normalizeEmail(email); login must produce the same value.
  assert.equal(normalizeEmail(" John.Doe@Acme.edu "), normalizeEmail("john.doe@acme.edu"));
});

test("hashPassword produces a bcrypt hash that comparePassword verifies", async () => {
  const hash = await hashPassword("StrongPass123!");
  // bcrypt hashes start with a $2a/$2b/$2x/$2y$ identifier followed by a cost.
  assert.match(hash, /^\$2[abxy]\$/);
  assert.equal(await comparePassword("StrongPass123!", hash), true);
  assert.equal(await comparePassword("WrongPass123!", hash), false);
});

test("comparePassword safely rejects missing password or hash (no bcrypt throw)", async () => {
  assert.equal(await comparePassword("", "$2b$10$abcdefghijklmnopqrstuv"), false);
  assert.equal(await comparePassword(null, "$2b$10$abcdefghijklmnopqrstuv"), false);
  assert.equal(await comparePassword("password", null), false);
  assert.equal(await comparePassword("password", undefined), false);
});