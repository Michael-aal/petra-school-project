const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const { Client } = require("pg");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const sqlPath = path.resolve(__dirname, "../prisma/migration-repair.sql");

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
      await client.query(sql);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }

    const requiredChecks = [
      ["Session", null],
      ["RefreshToken", null],
      ["Campus", null],
      ["Department", null],
      ["Section", null],
      ["Classroom", null],
      ["StudentDocument", null],
      ["TeacherAttendance", null],
      ["Assignment", null],
      ["GradeScale", null],
      ["Grade", null],
      ["ReportCard", null],
      ["Scholarship", null],
      ["Discount", null],
      ["Fine", null],
      ["BookCategory", null],
      ["Book", null],
      ["BorrowRecord", null],
      ["Vehicle", null],
      ["Route", null],
      ["Driver", null],
      ["StudentTransport", null],
      ["Announcement", null],
      ["Notification", null],
      ["Message", null],
      ["Timetable", null],
      ["Hostel", null],
      ["Room", null],
      ["RoomAllocation", null],
      ["ActivityLog", null],
      ["Settings", null],
      ["_RolePermission", null],
    ];

    for (const [table] of requiredChecks) {
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
    console.log("Next step: repair Prisma migration history with migrate resolve --applied.");
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error("\nSchema repair failed. Any transactional changes were rolled back.");
  console.error(error);
  process.exit(1);
});
