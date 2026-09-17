import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import prismaClientPackage from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const { PrismaClient } = prismaClientPackage;

export const HISTORICAL_MIGRATIONS_TO_SKIP = [
  "20260911070535_add_admin_user_relation",
  "20260911130000_add_payment_paymentmethodid",
];

export const MIGRATION_LOCK_RETRY_ATTEMPTS = 6;
export const MIGRATION_LOCK_RETRY_DELAY_MS = 5000;

export const buildNoopMigrationSql = (migrationName) =>
  `-- CI/production-only: historical migration skipped because it is incompatible with the current authoritative Prisma schema.\n-- Migration: ${migrationName}\n`;

export const isMigrationLockTimeout = (error) => {
  const message = [
    error?.message,
    error?.stderr?.toString?.(),
    error?.stdout?.toString?.(),
  ].filter(Boolean).join("\n");

  return (
    error?.status === 1 &&
    (/P1002\b/i.test(message) ||
      /timed out trying to acquire a postgres advisory lock/i.test(message) ||
      /pg_advisory_lock\(/i.test(message))
  );
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "..");
const prismaBin = process.platform === "win32"
  ? path.join(backendRoot, "node_modules", ".bin", "prisma.cmd")
  : path.join(backendRoot, "node_modules", ".bin", "prisma");
const migrationsRoot = path.join(backendRoot, "prisma", "migrations");

const runPrisma = (args) => {
  try {
    return execFileSync(prismaBin, args, {
      cwd: backendRoot,
      env: process.env,
      stdio: ["inherit", "inherit", "pipe"],
      encoding: "utf8",
    });
  } catch (error) {
    const stderr = error?.stderr?.toString?.() || "";
    if (stderr) process.stderr.write(stderr);
    throw error;
  }
};

export const runMigrationsWithLockRetry = async (deploy) => {
  for (let attempt = 1; attempt <= MIGRATION_LOCK_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return deploy();
    } catch (error) {
      if (!isMigrationLockTimeout(error) || attempt === MIGRATION_LOCK_RETRY_ATTEMPTS) {
        throw error;
      }

      const delayMs = MIGRATION_LOCK_RETRY_DELAY_MS;
      console.warn(
        `Prisma migration advisory lock is busy; retrying in ${delayMs / 1000}s ` +
        `(attempt ${attempt + 1}/${MIGRATION_LOCK_RETRY_ATTEMPTS}).`,
      );
      await sleep(delayMs);
    }
  }
};

const rollbackFailedHistoricalMigrations = async (prisma) => {
  for (const migrationName of HISTORICAL_MIGRATIONS_TO_SKIP) {
    let rows;
    try {
      rows = await prisma.$queryRawUnsafe(
        `SELECT "finished_at", "rolled_back_at" FROM "_prisma_migrations" WHERE "migration_name" = '${migrationName.replaceAll("'", "''")}' LIMIT 1`,
      );
    } catch (error) {
      const message = String(error?.message || "");
      const missingLedger =
        error?.code === "P2021" ||
        (error?.code === "P2010" && /_prisma_migrations.*does not exist|relation .*_prisma_migrations.*does not exist/i.test(message));

      if (missingLedger) {
        // A fresh database has no Prisma migration ledger yet; migrate deploy will create it.
        return;
      }
      throw error;
    }

    const migration = rows[0];
    if (!migration || migration.finished_at || migration.rolled_back_at) continue;

    console.log(`Resolving failed historical migration as rolled back: ${migrationName}`);
    runPrisma(["migrate", "resolve", "--rolled-back", migrationName]);
  }
};

const deployWithHistoricalMigrationsSkipped = async () => {
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

    await runMigrationsWithLockRetry(() => runPrisma(["migrate", "deploy"]));
  } finally {
    for (const backup of backups) {
      fs.writeFileSync(backup.migrationFile, backup.content, "utf8");
    }
  }
};

const createMigrationPrisma = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to run production migrations.");
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  return new PrismaClient({ adapter });
};

const main = async () => {
  const prisma = createMigrationPrisma();
  try {
    await prisma.$connect();
    await rollbackFailedHistoricalMigrations(prisma);
  } finally {
    await prisma.$disconnect();
  }

  await deployWithHistoricalMigrationsSkipped();
};

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
