const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const dotenv = require("dotenv");

// This utility is intentionally separate from Prisma migration history.
// It reconciles a database that is partially ahead of its migration history
// with the current Prisma schema, while preserving legacy columns that Prisma
// no longer maps.

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const backendDir = path.resolve(__dirname, "..");
const outputPath = path.join(
  backendDir,
  "prisma",
  "migration-repair.sql"
);

function runPrismaDiff() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not loaded. Check backend/.env.");
  }

  // Prisma 7 removed --from-url. The database connection now comes from the
  // datasource in prisma.config.ts via --from-config-datasource.
  // Windows needs the command shell when launching npx.cmd from Node.
  const command = process.platform === "win32" ? "npx.cmd" : "npx";

  const result = spawnSync(
    command,
    [
      "prisma",
      "migrate",
      "diff",
      "--from-config-datasource",
      "--to-schema",
      "prisma/schema.prisma",
      "--script",
    ],
    {
      cwd: backendDir,
      encoding: "utf8",
      shell: process.platform === "win32",
      maxBuffer: 20 * 1024 * 1024,
      windowsHide: true,
    }
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `Prisma migrate diff failed (exit ${result.status}).\n${result.stderr || result.stdout}`
    );
  }

  return result.stdout;
}

function preserveLegacyColumns(sql) {
  // These columns are present in older DB versions but are intentionally no
  // longer represented by the current Prisma models. Keeping them is safer
  // than silently deleting historical data during recovery.
  //
  // Prisma may combine multiple DROP COLUMN clauses into one ALTER TABLE, so
  // remove only the individual legacy clauses rather than relying on a whole
  // statement matching exactly.
  const legacyColumns = [
    ["Admin", "name"],
    ["Teacher", "name"],
    ["InstallmentPlan", "endDate"],
    ["InstallmentPlan", "startDate"],
    ["StudentMedicalInfo", "insuranceNumber"],
    ["StudentMedicalInfo", "insuranceProvider"],
    // Payment.paymentMethodId already exists in the live database and was
    // introduced by the earlier payment-method migration. The current Prisma
    // model no longer maps it, but removing it would discard existing schema
    // and could break payment compatibility. Preserve it as a legacy column.
    ["Payment", "paymentMethodId"],
  ];

  let safeSql = sql;

  for (const [table, column] of legacyColumns) {
    const pattern = new RegExp(
      `DROP COLUMN\\s+"${column}"(?:,\\s*|\\s*(?=;))`,
      "g"
    );
    safeSql = safeSql.replace(
      pattern,
      `/* Preserved legacy column ${table}.${column}; Prisma no longer maps it. */ `
    );
  }

  // If a table change contained only legacy DROP COLUMN clauses, preserving
  // those columns leaves an empty ALTER TABLE statement. Remove only those
  // exact empty statements; never use a cross-statement wildcard here because
  // that can accidentally delete real ALTER TABLE operations such as Admin's
  // new columns.
  safeSql = safeSql.replace(
    /ALTER TABLE\s+"[^"]+"\s+(?:(?:\/\* Preserved legacy column [^*]*\*\/\s*)+);/g,
    ""
  );

  // Remove a dangling comma left before a statement terminator.
  safeSql = safeSql.replace(/,\s*;/g, ";");

  return safeSql;
}

function main() {
  const mode = process.argv[2] || "plan";

  if (!["plan", "apply"].includes(mode)) {
    console.error("Usage: node scripts/repair-prisma-migrations.cjs [plan|apply]");
    process.exit(1);
  }

  const diff = runPrismaDiff();
  const safeSql = preserveLegacyColumns(diff);

  fs.writeFileSync(outputPath, safeSql, "utf8");

  console.log(`\nRepair SQL written to:\n${outputPath}`);
  console.log(`SQL length: ${safeSql.length} characters`);

  if (mode === "plan") {
    console.log("\nPLAN ONLY: no database changes were made.");
    console.log("Review prisma/migration-repair.sql before applying it.");
    return;
  }

  console.log("\nAPPLY mode is intentionally disabled in this script.");
  console.log("Apply the reviewed SQL with your PostgreSQL client, then verify the schema before repairing Prisma migration history.");
  process.exit(2);
}

main();
