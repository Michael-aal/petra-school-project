const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const dotenv = require("dotenv");

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
  const legacyColumns = [
    ["Admin", "name"],
    ["Teacher", "name"],
    ["InstallmentPlan", "endDate"],
    ["InstallmentPlan", "startDate"],
    ["StudentMedicalInfo", "insuranceNumber"],
    ["StudentMedicalInfo", "insuranceProvider"],
    ["Payment", "paymentMethodId"],
  ];

  let safeSql = sql;

  // Remove only the individual legacy DROP COLUMN clauses. Prisma can put
  // several ALTER TABLE actions into one statement, so deleting a whole
  // ALTER TABLE block here can accidentally remove real schema changes.
  for (const [table, column] of legacyColumns) {
    const pattern = new RegExp(
      `DROP COLUMN\\s+"${column}"(?:\\s*,\\s*|\\s*(?=;))`,
      "g"
    );
    safeSql = safeSql.replace(pattern, "");
  }

  // A DROP COLUMN may have been the only action in an ALTER TABLE statement.
  // In that case Prisma's generated SQL becomes `ALTER TABLE "X";`, which is
  // invalid PostgreSQL. Remove empty ALTER TABLE statements before execution.
  // The expression deliberately allows whitespace and comments, but requires
  // the statement to contain no actual ALTER TABLE action.
  safeSql = safeSql.replace(
    /ALTER TABLE\\s+"[^"]+"\\s*(?:(?:\/\\*[\\s\\S]*?\\*\/|--[^\\r\\n]*(?:\\r?\\n|$))\\s*)*;/g,
    ""
  );

  // Remove any dangling comma before a statement terminator left by clause
  // removal. This is intentionally narrow and cannot consume real actions.
  safeSql = safeSql.replace(/,\\s*;/g, ";");

  // Final defensive check: this exact form can never be valid PostgreSQL and
  // should never reach apply-prisma-repair.cjs.
  const emptyAlter = /ALTER TABLE\\s+"[^"]+"\\s*(?:\/\\*[\\s\\S]*?\\*\/\\s*)*;/i;
  if (emptyAlter.test(safeSql)) {
    throw new Error(
      "Generated repair SQL still contains an empty ALTER TABLE statement. Refusing to write unsafe SQL."
    );
  }

  return safeSql.trim() + "\\n";
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
