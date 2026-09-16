import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

export const HISTORICAL_MIGRATIONS_TO_SKIP = [
  "20260911070535_add_admin_user_relation",
  "20260911130000_add_payment_paymentmethodid",
];

export const buildNoopMigrationSql = (migrationName) =>
  `-- CI/production-only: historical migration skipped because it is incompatible with the current authoritative Prisma schema.\n-- Migration: ${migrationName}\n`;

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "..");
const prismaBin = process.platform === "win32"
  ? path.join(backendRoot, "node_modules", ".bin", "prisma.cmd")
  : path.join(backendRoot, "node_modules", ".bin", "prisma");
const migrationsRoot = path.join(backendRoot, "prisma", "migrations");

const runPrisma = (args) => {
  execFileSync(prismaBin, args, {
    cwd: backendRoot,
    env: process.env,
    stdio: "inherit",
  });
};

const rollbackFailedHistoricalMigrations = async (prisma) => {
  for (const migrationName of HISTORICAL_MIGRATIONS_TO_SKIP) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT "finished_at", "rolled_back_at" FROM "_prisma_migrations" WHERE "migration_name" = '${migrationName.replaceAll("'", "''")}' LIMIT 1`,
    );

    const migration = rows[0];
    if (!migration || migration.finished_at || migration.rolled_back_at) continue;

    console.log(`Resolving failed historical migration as rolled back: ${migrationName}`);
    runPrisma(["migrate", "resolve", "--rolled-back", migrationName]);
  }
};

const deployWithHistoricalMigrationsSkipped = () => {
  const backups = [];

  try {
    for (const migrationName of HISTORICAL_MIGRATIONS_TO_SKIP) {
      const migrationFile = path.join(migrationsRoot, migrationName, "migration.sql");
      if (!fs.existsSync(migrationFile)) {
        throw new Error(`Expected historical migration file is missing: ${migrationFile}`);
      }

      backups.push({
        migrationFile,
        content: fs.readFileSync(migrationFile, "utf8"),
      });
      fs.writeFileSync(migrationFile, buildNoopMigrationSql(migrationName), "utf8");
    }

    runPrisma(["migrate", "deploy"]);
  } finally {
    for (const backup of backups) {
      fs.writeFileSync(backup.migrationFile, backup.content, "utf8");
    }
  }
};

const main = async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    await rollbackFailedHistoricalMigrations(prisma);
  } finally {
    await prisma.$disconnect();
  }

  deployWithHistoricalMigrationsSkipped();
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
