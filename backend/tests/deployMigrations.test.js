import test from "node:test";
import assert from "node:assert/strict";
import { HISTORICAL_MIGRATIONS_TO_SKIP, buildNoopMigrationSql } from "../scripts/deployMigrations.js";

test("production migration policy keeps the incompatible historical migrations explicitly skipped", () => {
  assert.deepEqual(HISTORICAL_MIGRATIONS_TO_SKIP, [
    "20260911070535_add_admin_user_relation",
    "20260911130000_add_payment_paymentmethodid",
  ]);
});

test("skipped migration SQL is a valid no-op marker", () => {
  assert.match(
    buildNoopMigrationSql("20260911070535_add_admin_user_relation"),
    /CI\/production-only: historical migration skipped/,
  );
});
