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
const prismaCli = process.platform === "win32" ? "npx.cmd" : "npx";
const outputPath = path.join(
  backendDir,
  "prisma",
  "migration-repair.sql"
);

function runPrismaDiff() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not loaded. Check backend/.env.");
  }

  const result = spawnSync(
    prismaCli,
    [
      "prisma",
      "migrate",
      "diff",
      "--from-url",
      process.env.DATABASE_URL,
      "--to-schema-datamodel",
      "prisma/schema.prisma",
      "--script",
    ],
    {
      cwd: backendDir,
      encoding: "utf8",
      shell: false,
      maxBuffer: 20 * 1024 * 1024,
    }
  );

  if (result.error) throw result.error;
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
  const legacyDrops = [
    /ALTER TABLE "Admin" DROP COLUMN "name";\s*/g,
    /ALTER TABLE "Teacher" DROP COLUMN "name";\s*/g,
    /ALTER TABLE "InstallmentPlan" DROP COLUMN "endDate";\s*/g,
    /ALTER TABLE "InstallmentPlan" DROP COLUMN "startDate";\s*/g,
    /ALTER TABLE "StudentMedicalInfo" DROP COLUMN "insuranceNumber";\s*/g,
    /ALTER TABLE "StudentMedicalInfo" DROP COLUMN "insuranceProvider";\s*/g,
  ];

  let safeSql = sql;
  for (const pattern of legacyDrops) {
    safeSql = safeSql.replace(pattern, "-- Preserved legacy column during migration repair.\n");
  }

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
