import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

const envPath = path.resolve(process.cwd(), ".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  datasource: {
    url: process.env.DATABASE_URL || "",
  },
  env: {
    path: envPath,
  },
});
