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

function isMissingForeignKeyColumnError(error, statement) {
  return (
    error?.code === "42703" &&
    /\bALTER\s+TABLE\b[\s\S]*\bADD\s+CONSTRAINT\b[\s\S]*\bFOREIGN\s+KEY\b/i.test(statement)
  );
}

async function applyRepairSql(client, sql) {
  const statements = splitSqlStatements(sql);
  let applied = 0;
  let skipped = 0;
  let skippedIndexes = 0;
  let skippedForeignKeys = 0;

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

      // Some older databases have a legacy table shape that is missing a
      // relationship column (for example classId). Do not roll back the whole
      // repair just because a foreign-key constraint targets that absent
      // column. The repair must preserve existing data and continue restoring
      // independent tables such as TeacherAttendance, AcademicYear and Term.
      if (isMissingForeignKeyColumnError(error, statement)) {
        await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
        await client.query(`RELEASE SAVEPOINT ${savepoint}`);
        skippedForeignKeys += 1;
        console.log(`Skipping incompatible foreign key because a referenced/local column is absent: ${error.message}`);
        continue;
      }

      await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
      await client.query(`RELEASE SAVEPOINT ${savepoint}`);
      throw error;
    }
  }

  return { applied, skipped, skippedIndexes, skippedForeignKeys, total: statements.length };
}

async function backfillAcademicCalendar(client) {
  // Older installations created AcademicSession records without creating the
  // normalized AcademicYear + Term records used by attendance/finance.
  // Backfill only missing canonical records; never delete or rewrite history.
  const years = await client.query(`
    INSERT INTO "AcademicYear" (
      "id", "schoolId", "name", "startsAt", "endsAt", "isActive", "createdAt", "updatedAt"
    )
    SELECT
      md5('academic-year:' || s."schoolId"::text || ':' || s."name") AS "id",
      s."schoolId",
      s."name",
      MIN(s."startsAt"),
      MAX(s."endsAt"),
      BOOL_OR(s."isActive"),
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM "AcademicSession" s
    GROUP BY s."schoolId", s."name"
    ON CONFLICT ("schoolId", "name") DO NOTHING
    RETURNING "id"
  `);

  const terms = await client.query(`
    INSERT INTO "Term" (
      "id", "schoolId", "academicYearId", "name", "startsAt", "endsAt", "isActive", "createdAt", "updatedAt"
    )
    SELECT
      md5('term:' || s."schoolId"::text || ':' || s."name" || ':' || s."term") AS "id",
      s."schoolId",
      ay."id",
      CASE
        WHEN s."term" ~* '\\mterm$' THEN s."term"
        ELSE s."term" || ' Term'
      END,
      MIN(s."startsAt"),
      MAX(s."endsAt"),
      BOOL_OR(s."isActive"),
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM "AcademicSession" s
    JOIN "AcademicYear" ay
      ON ay."schoolId" = s."schoolId"
     AND ay."name" = s."name"
    GROUP BY s."schoolId", s."name", s."term", ay."id"
    ON CONFLICT ("academicYearId", "name") DO NOTHING
    RETURNING "id"
  `);

  await client.query(`
    UPDATE "AcademicYear" ay
    SET "isActive" = TRUE, "updatedAt" = CURRENT_TIMESTAMP
    FROM "AcademicSession" s
    WHERE s."schoolId" = ay."schoolId"
      AND s."name" = ay."name"
      AND s."isActive" = TRUE
  `);

  await client.query(`
    UPDATE "Term" t
    SET "isActive" = TRUE, "updatedAt" = CURRENT_TIMESTAMP
    FROM "AcademicSession" s
    JOIN "AcademicYear" ay
      ON ay."schoolId" = s."schoolId"
     AND ay."name" = s."name"
    WHERE t."academicYearId" = ay."id"
      AND t."schoolId" = s."schoolId"
      AND t."name" = CASE
        WHEN s."term" ~* '\\mterm$' THEN s."term"
        ELSE s."term" || ' Term'
      END
      AND s."isActive" = TRUE
  `);

  return { yearsCreated: years.rowCount, termsCreated: terms.rowCount };
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
      const calendar = await backfillAcademicCalendar(client);
      console.log(
        `Repair SQL processed: ${result.applied} applied, ${result.skipped} existing objects skipped, ${result.skippedIndexes} incompatible indexes skipped, ${result.skippedForeignKeys} incompatible foreign keys skipped, ${result.total} total statements.`
      );
      console.log(
        `Academic calendar backfill: ${calendar.yearsCreated} years created, ${calendar.termsCreated} terms created.`
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

    const academicCalendarTables = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM "AcademicYear") AS "academicYears",
        (SELECT COUNT(*) FROM "Term") AS "terms"
    `);

    console.log("Schema repair committed successfully.");
    console.log("Payment.paymentMethodId is still present.");
    console.log("Required missing tables are present.");
    console.log(
      `Academic calendar verified: ${academicCalendarTables.rows[0].academicYears} years, ${academicCalendarTables.rows[0].terms} terms.`
    );
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
