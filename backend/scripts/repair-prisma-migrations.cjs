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

const LEGACY_COLUMNS = new Set([
  "Admin.name",
  "Teacher.name",
  "InstallmentPlan.endDate",
  "InstallmentPlan.startDate",
  "StudentMedicalInfo.insuranceNumber",
  "StudentMedicalInfo.insuranceProvider",
  "Payment.paymentMethodId",
]);

function runPrismaDiff() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not loaded. Check backend/.env.");
  }

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

  if (result.error) throw result.error;

  if (result.status !== 0) {
    throw new Error(
      `Prisma migrate diff failed (exit ${result.status}).\n${result.stderr || result.stdout}`
    );
  }

  return result.stdout;
}

function splitAlterActions(actionsSql) {
  const actions = [];
  let start = 0;
  let depth = 0;
  let quote = null;
  let lineComment = false;
  let blockComment = false;

  for (let i = 0; i < actionsSql.length; i += 1) {
    const ch = actionsSql[i];
    const next = actionsSql[i + 1];

    if (lineComment) {
      if (ch === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (ch === "*" && next === "/") {
        blockComment = false;
        i += 1;
      }
      continue;
    }

    if (quote) {
      if (ch === quote) {
        if (quote === '"' && next === '"') i += 1;
        else quote = null;
      }
      continue;
    }

    if (ch === "-" && next === "-") {
      lineComment = true;
      i += 1;
      continue;
    }

    if (ch === "/" && next === "*") {
      blockComment = true;
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (ch === "(") depth += 1;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if (ch === "," && depth === 0) {
      const action = actionsSql.slice(start, i).trim();
      if (action) actions.push(action);
      start = i + 1;
    }
  }

  const last = actionsSql.slice(start).trim();
  if (last) actions.push(last);
  return actions;
}

function isLegacyDrop(table, action) {
  const match = action.match(/^DROP\s+COLUMN\s+"([^"]+)"$/i);
  return Boolean(match && LEGACY_COLUMNS.has(`${table}.${match[1]}`));
}

function preserveLegacyColumns(sql) {
  const alterTablePattern = /ALTER TABLE\s+"([^"]+)"\s+([\s\S]*?);/gi;

  const safeSql = sql.replace(
    alterTablePattern,
    (full, table, actionsSql) => {
      const actions = splitAlterActions(actionsSql);
      const keptActions = actions.filter(
        (action) => !isLegacyDrop(table, action)
      );

      if (keptActions.length === 0) return "";

      return `ALTER TABLE "${table}" ${keptActions.join(",\n")};`;
    }
  );

  return safeSql;
}

function cleanAndValidate(sql) {
  let safeSql = sql;

  safeSql = safeSql.replace(
    /^\s*ALTER TABLE\s+"[^"]+"\s*;\s*$/gim,
    ""
  );

  safeSql = safeSql.replace(/\n{3,}/g, "\n\n").trim();

  if (/ALTER TABLE\s+"[^"]+"\s*;/i.test(safeSql)) {
    throw new Error(
      "Generated repair SQL still contains an empty ALTER TABLE statement. Refusing to write unsafe SQL."
    );
  }

  if (/,\s*;/m.test(safeSql)) {
    throw new Error(
      "Generated repair SQL contains a dangling comma before a statement terminator. Refusing to write unsafe SQL."
    );
  }

  return `${safeSql}\n`;
}

function main() {
  const mode = process.argv[2] || "plan";

  if (!["plan", "apply"].includes(mode)) {
    console.error("Usage: node scripts/repair-prisma-migrations.cjs [plan|apply]");
    process.exit(1);
  }

  const diff = runPrismaDiff();
  const safeSql = cleanAndValidate(preserveLegacyColumns(diff));

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
