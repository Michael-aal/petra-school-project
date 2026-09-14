const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const { Client } = require("pg");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const sqlPath = path.resolve(__dirname, "../prisma/migration-repair.sql");

function splitSqlStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function isSafeDuplicateError(error) {
  return ["42P07", "42701", "42710"].includes(error?.code);
}

function isMissingIndexColumnError(error, statement) {
  return error?.code === "42703" && /\bCREATE\s+(?:UNIQUE\s+)?INDEX\b/i.test(statement);
}

async function applyRepairSql(client, sql) {
  const statements = splitSqlStatements(sql);
  let applied = 0;
  let skipped = 0;
  let skippedIndexes = 0;

  for (let index = 0; index < statements.length; index += 1) {
    const statement = statements[index];
    const savepoint = `repair_stmt_${index}`;

    await client.query(`SAVEPOINT ${savepoint}`);

    try {
      await client.query(statement);
      await client.query(`RELEASE SAVEPOINT ${savepoint}`);
      applied += 1;
    } catch (error) {
      if (isSafeDuplicateError(error)) {
        await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
        await client.query(`RELEASE SAVEPOINT ${savepoint}`);
        skipped += 1;
        console.log(`Skipping existing database object: ${error.message}`);
        continue;
      }

      if (isMissingIndexColumnError(error, statement)) {
        await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
        await client.query(`RELEASE SAVEPOINT ${savepoint}`);
        skippedIndexes += 1;
        console.log(`Skipping incompatible index because its column is absent: ${error.message}`);
        continue;
      }

      await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
      await client.query(`RELEASE SAVEPOINT ${savepoint}`);
      throw error;
    }
  }

  return { applied, skipped, skippedIndexes, total: statements.length };
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
        `Repair SQL processed: ${result.applied} applied, ${result.skipped} existing objects skipped, ${result.skippedIndexes} incompatible indexes skipped, ${result.total} total statements.`
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
