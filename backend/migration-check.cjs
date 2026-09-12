require("dotenv").config();
const { Client } = require("pg");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();

  const tables = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'Admin',
        'Assessment',
        'Result',
        'Teacher',
        'TimetableEntry',
        'Parent',
        'Payment',
        'Wallet'
      )
    ORDER BY table_name;
  `);

  console.log("\n========== EXISTING TABLES ==========");
  console.table(tables.rows);

  const columns = await client.query(`
    SELECT
      table_name,
      column_name,
      is_nullable,
      data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN (
        'Admin',
        'Assessment',
        'Result',
        'Teacher',
        'TimetableEntry',
        'Parent',
        'Payment',
        'Wallet'
      )
    ORDER BY table_name, ordinal_position;
  `);

  console.log("\n========== EXISTING COLUMNS ==========");
  console.table(columns.rows);

  const counts = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM "Admin") AS admins,
      (SELECT COUNT(*) FROM "Assessment") AS assessments,
      (SELECT COUNT(*) FROM "Result") AS results,
      (SELECT COUNT(*) FROM "Teacher") AS teachers,
      (SELECT COUNT(*) FROM "TimetableEntry") AS timetable_entries,
      (SELECT COUNT(*) FROM "Parent") AS parents,
      (SELECT COUNT(*) FROM "Payment") AS payments,
      (SELECT COUNT(*) FROM "Wallet") AS wallets;
  `);

  console.log("\n========== ROW COUNTS ==========");
  console.table(counts.rows);

  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end().catch(() => {});
  process.exit(1);
});