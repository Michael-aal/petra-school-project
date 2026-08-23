import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { AsyncLocalStorage } from "node:async_hooks";

import "./loadEnv.js";

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

const createBasePrisma = () => {
  if (!hasDatabaseUrl) {
    return {
      _dmmf: null,
      _runtimeDataModel: null,
      $extends: () => ({}),
      $connect: async () => undefined,
      $disconnect: async () => undefined,
    };
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
  });
};

const basePrisma = globalThis.prisma || createBasePrisma();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = basePrisma;
}

const schoolContext = new AsyncLocalStorage();

const getSchemaModel = (model) => {
  if (!model) return null;
  const candidateNames = [String(model), String(model).slice(0, 1).toUpperCase() + String(model).slice(1)];

  if (basePrisma._dmmf?.modelMap) {
    for (const name of candidateNames) {
      if (basePrisma._dmmf.modelMap[name]) {
        return basePrisma._dmmf.modelMap[name];
      }
    }
  }

  if (basePrisma._runtimeDataModel?.models) {
    for (const name of candidateNames) {
      if (basePrisma._runtimeDataModel.models[name]) {
        return basePrisma._runtimeDataModel.models[name];
      }
    }
  }

  return null;
};

const modelHasSchoolId = (model) => {
  try {
    const schemaModel = getSchemaModel(model);
    return Boolean(schemaModel?.fields?.some((field) => field.name === "schoolId"));
  } catch {
    return false;
  }
};

// Operations that accept a full `where` filter and must be scoped to the tenant.
const WHERE_SCOPED_OPERATIONS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "updateMany",
  "deleteMany",
]);

export const scopeWhere = (where, tenant) => {
  if (!where) return { schoolId: tenant };
  if (!Object.prototype.hasOwnProperty.call(where, "schoolId")) {
    return { AND: [where, { schoolId: tenant }] };
  }
  return { ...where, schoolId: tenant };
};

export const scopeTenantData = (data, tenant) => {
  if (!data || typeof data !== "object") return data;
  if (Object.prototype.hasOwnProperty.call(data, "school")) {
    throw Object.assign(new Error("Nested school relation writes are not allowed in a tenant context"), {
      statusCode: 403,
    });
  }
  return { ...data, schoolId: tenant };
};

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const store = schoolContext.getStore();
        if (store?.skipTenant) return query(args);

        const tenant = store?.schoolId;
        if (!tenant || !modelHasSchoolId(model)) return query(args);

        const nextArgs = args ? { ...args } : {};

        if (WHERE_SCOPED_OPERATIONS.has(operation)) {
          nextArgs.where = scopeWhere(nextArgs.where, tenant);
        }

        if ((operation === "create" || operation === "update") && nextArgs.data && !Array.isArray(nextArgs.data)) {
          nextArgs.data = scopeTenantData(nextArgs.data, tenant);
        }

        if ((operation === "createMany" || operation === "createManyAndReturn") && Array.isArray(nextArgs.data)) {
          nextArgs.data = nextArgs.data.map((item) => scopeTenantData(item, tenant));
        }

        if (operation === "upsert" && nextArgs.create) {
          nextArgs.create = scopeTenantData(nextArgs.create, tenant);
          if (nextArgs.update) nextArgs.update = scopeTenantData(nextArgs.update, tenant);
        }

        return query(nextArgs);
      },
    },
  },
});

export const setCurrentSchoolId = (schoolId) => {
  const current = schoolContext.getStore() || {};
  const nextSchoolId = schoolId === undefined || schoolId === null ? null : Number(schoolId);
  schoolContext.enterWith({ ...current, schoolId: nextSchoolId, skipTenant: false });
};

export const clearCurrentSchoolId = () => {
  const current = schoolContext.getStore() || {};
  schoolContext.enterWith({ ...current, schoolId: null, skipTenant: false });
};

export const runWithSchoolContext = (schoolId, callback) => {
  const nextSchoolId = schoolId === undefined || schoolId === null ? null : Number(schoolId);
  return schoolContext.run({ schoolId: nextSchoolId, skipTenant: false }, callback);
};

export const runWithoutSchoolContext = (callback) => {
  const current = schoolContext.getStore() || {};
  return schoolContext.run({ ...current, schoolId: null, skipTenant: true }, callback);
};

export const getCurrentSchoolId = () => {
  const store = schoolContext.getStore();
  return store?.schoolId ?? null;
};

const connectDB = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Check backend/.env before starting the server.");
  }

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
