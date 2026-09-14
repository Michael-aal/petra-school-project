const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const { Client } = require("pg");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const sqlPath = path.resolve(__dirname, "../prisma/migration-repair.sql");

function splitSqlStatements(sql) {
  // migration-repair.sql is a DDL repair script. Its statements are terminated
  // with semicolons and do not contain procedural dollar-quoted blocks.
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function isSafeDuplicateError(error) {
  // These errors mean the object being repaired is already present. They are
  // safe to skip because this script is specifically designed to reconcile a
  // partially repaired database without deleting existing data.
  return ["42P07", "42701", "42710"].includes(error?.code);
}

async function applyRepairSql(client, sql) {
  const statements = splitSqlStatements(sql);
  let applied = 0;
  let skipped = 0;

  for (const statement of statements) {
    try {
      await client.query(statement);
      applied += 1;
    } catch (error) {
      if (isSafeDuplicateError(error)) {
        skipped += 1;
        console.log(`Skipping existing database object: ${error.message}`);
        continue;
      }
      throw error;
    }
  }

  return { applied, skipped, total: statements.length };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not loaded. Check backend/.env.");
  }

  if (!fs.existsSync(sqlPath)) {
    throw new Error(`Repair SQL not found: ${sqlPath}`);
  }

  const sql = fs.readFileSync(sqlPath, "utf8");

  if (/DROP\s+COLUMN\s+"paymentMethodId"/i.test(sql)) {
    throw new Error(
      'Refusing to apply repair: migration-repair.sql still attempts to drop Payment.paymentMethodId.'
    );
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();

    const paymentColumn = await client.query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Payment'
        AND column_name = 'paymentMethodId'
    `);

    if (paymentColumn.rowCount !== 1) {
      throw new Error(
        'Expected live Payment.paymentMethodId to exist before repair; refusing to continue.'
      );
    }

    console.log("Beginning transactional schema repair...");
    await client.query("BEGIN");

    try {
      const result = await applyRepairSql(client, sql);
      console.log(
        `Repair SQL processed: ${result.applied} applied, ${result.skipped} existing objects skipped, ${result.total} total statements.`
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }

    const requiredChecks = [
      "Session",
      "RefreshToken",
      "Campus",
      "Department",
      "Section",
      "Classroom",
      "StudentDocument",
      "TeacherAttendance",
      "AssessmentItem",
      "Assignment",
      "AssignmentSubmission",
      "GradeScale",
      "Grade",
      "ReportCard",
      "Scholarship",
      "Discount",
      "Fine",
      "BookCategory",
      "Book",
      "BorrowRecord",
      "Vehicle",
      "Route",
      "Driver",
      "StudentTransport",
      "Announcement",
      "Notification",
      "Message",
      "Timetable",
      "Hostel",
      "Room",
      "RoomAllocation",
      "ActivityLog",
      "Settings",
      "_RolePermission",
    ];

    for (const table of requiredChecks) {
      const result = await client.query(
        `SELECT to_regclass($1) AS table_name`,
        [`public."${table}"`]
      );
      if (!result.rows[0].table_name) {
        throw new Error(`Repair verification failed: table ${table} is missing.`);
      }
    }

    const preservedPaymentColumn = await client.query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Payment'
        AND column_name = 'paymentMethodId'
    `);

    if (preservedPaymentColumn.rowCount !== 1) {
      throw new Error(
        'Repair verification failed: Payment.paymentMethodId was not preserved.'
      );
    }

    console.log("Schema repair committed successfully.");
    console.log("Payment.paymentMethodId is still present.");
    console.log("Required missing tables are present.");
    console.log("Next step: run `npx prisma generate` and restart the backend.");
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error("\nSchema repair failed. Any transactional changes were rolled back.");
  console.error(error);
  process.exit(1);
});
