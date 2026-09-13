import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { Client } from "pg";
import "../config/loadEnv.js";

// Run only against a disposable staging database. DATABASE_URL is used for
// fixture setup; RLS_TEST_DATABASE_URL must authenticate as petra_app (or an
// equivalent non-owner role with no BYPASSRLS privilege).
const ownerUrl = process.env.DATABASE_URL;
const appUrl = process.env.RLS_TEST_DATABASE_URL;

const createClient = (connectionString) => new Client({ connectionString });
const setTenant = (client, schoolId) => client.query(
  "SELECT set_config('app.current_school_id', $1, true)",
  [String(schoolId)],
);

test("RLS prevents cross-school reads and writes for the runtime database role", {
  skip: !ownerUrl || !appUrl ? "Set DATABASE_URL and RLS_TEST_DATABASE_URL to run the RLS integration test." : false,
}, async () => {
  const owner = createClient(ownerUrl);
  const app = createClient(appUrl);
  const suffix = crypto.randomBytes(8).toString("hex");
  let schoolOneId;
  let schoolTwoId;

  try {
    await owner.connect();
    await app.connect();

    const firstSchool = await owner.query(
      'INSERT INTO "School" ("name", "country") VALUES ($1, $2) RETURNING "id"',
      [`RLS test one ${suffix}`, "NG"],
    );
    const secondSchool = await owner.query(
      'INSERT INTO "School" ("name", "country") VALUES ($1, $2) RETURNING "id"',
      [`RLS test two ${suffix}`, "NG"],
    );
    schoolOneId = firstSchool.rows[0].id;
    schoolTwoId = secondSchool.rows[0].id;

    await app.query("BEGIN");
    await setTenant(app, schoolOneId);
    await app.query(
      'INSERT INTO "Student" ("id", "schoolId", "name") VALUES ($1, $2, $3)',
      [`rls_${suffix}`, schoolOneId, "Tenant one student"],
    );
    await app.query("COMMIT");

    await app.query("BEGIN");
    await setTenant(app, schoolTwoId);
    const hidden = await app.query(
      'SELECT "id" FROM "Student" WHERE "id" = $1',
      [`rls_${suffix}`],
    );
    assert.equal(hidden.rowCount, 0, "tenant two must not read tenant one's student");
    await app.query("COMMIT");

    await app.query("BEGIN");
    await setTenant(app, schoolOneId);
    await assert.rejects(
      app.query(
        'INSERT INTO "Student" ("id", "schoolId", "name") VALUES ($1, $2, $3)',
        [`rls_cross_${suffix}`, schoolTwoId, "Cross-school write"],
      ),
      (error) => error?.code === "42501",
      "tenant one must not create a record for tenant two",
    );
    await app.query("ROLLBACK");
  } finally {
    await app.end().catch(() => undefined);
    if (schoolOneId || schoolTwoId) {
      await owner.query('DELETE FROM "School" WHERE "id" = ANY($1::int[])', [[schoolOneId, schoolTwoId].filter(Boolean)]).catch(() => undefined);
    }
    await owner.end().catch(() => undefined);
  }
});
