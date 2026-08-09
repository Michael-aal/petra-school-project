import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { AsyncLocalStorage } from "node:async_hooks";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Check backend/.env before starting the server.");
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const basePrisma =
  globalThis.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
  });

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

const prisma = basePrisma.$extends({
  query: {
    before: async (params) => {
      const store = schoolContext.getStore();
      if (store?.skipTenant) {
        return params;
      }

      const tenant = store?.schoolId;
      if (!tenant) {
        return params;
      }

      if (!modelHasSchoolId(params.model)) {
        return params;
      }

      const action = params.action;

      if (action === "findMany" || action === "findFirst" || action === "count" || action === "findUnique") {
        params.args = params.args || {};
        if (!params.args.where) {
          params.args.where = { schoolId: tenant };
        } else if (!Object.prototype.hasOwnProperty.call(params.args.where, "schoolId")) {
          params.args.where = { AND: [params.args.where, { schoolId: tenant }] };
        } else {
          params.args.where.schoolId = tenant;
        }
      }

      if (action === "create" || action === "createMany") {
        if (params.args && params.args.data) {
          if (Array.isArray(params.args.data)) {
            params.args.data = params.args.data.map((d) => ({ ...d, schoolId: tenant }));
          } else {
            params.args.data.schoolId = tenant;
          }
        }
      }

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

      return params;
    },
    after: async (result) => result,
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
