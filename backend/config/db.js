import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Check backend/.env before starting the server.");
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma =
  globalThis.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

// Current school tenant context (set per incoming request by auth middleware)
let currentSchoolId = null;

export const setCurrentSchoolId = (schoolId) => {
  currentSchoolId = schoolId === undefined || schoolId === null ? null : Number(schoolId);
};

export const clearCurrentSchoolId = () => {
  currentSchoolId = null;
};

// Prisma middleware: enforce tenant scoping for list/create/updateMany/deleteMany operations
// This middleware adjusts `where` clauses and `data.schoolId` when a request context sets `currentSchoolId`.
try {
  prisma.$use(async (params, next) => {
    const tenant = currentSchoolId;
    const action = params.action;

    if (!tenant) {
      return next(params);
    }

    // Apply tenant filter for list-like queries
    if (action === "findMany" || action === "findFirst" || action === "count") {
      params.args = params.args || {};
      if (!params.args.where) {
        params.args.where = { schoolId: tenant };
      } else if (!Object.prototype.hasOwnProperty.call(params.args.where, "schoolId")) {
        params.args.where = { AND: [params.args.where, { schoolId: tenant }] };
      } else {
        params.args.where.schoolId = tenant;
      }
    }

    // Create operations: force data.schoolId to tenant
    if (action === "create" || action === "createMany") {
      if (params.args && params.args.data) {
        if (Array.isArray(params.args.data)) {
          params.args.data = params.args.data.map((d) => ({ ...d, schoolId: tenant }));
        } else {
          params.args.data.schoolId = tenant;
        }
      }
    }

    // UpdateMany/DeleteMany: ensure where includes tenant
    if (action === "updateMany" || action === "deleteMany") {
      params.args = params.args || {};
      if (!params.args.where) {
        params.args.where = { schoolId: tenant };
      } else if (!Object.prototype.hasOwnProperty.call(params.args.where, "schoolId")) {
        params.args.where = { AND: [params.args.where, { schoolId: tenant }] };
      } else {
        params.args.where.schoolId = tenant;
      }
    }

    return next(params);
  });
} catch (err) {
  // If middleware cannot be registered, log and continue — this should not happen in normal runs.
  console.error("Failed to register Prisma tenant middleware:", err.message);
}

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (err) {
    console.error(`Database error: ${err.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await prisma.$disconnect();
};

export { prisma, connectDB, disconnectDB };
