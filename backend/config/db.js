import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { AsyncLocalStorage } from "node:async_hooks";

import "./loadEnv.js";

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

const withPoolLimits = (databaseUrl) => {
  const url = new URL(databaseUrl);
  if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", process.env.DATABASE_CONNECTION_LIMIT || "15");
  if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", process.env.DATABASE_POOL_TIMEOUT || "30");
  return url.toString();
};

const createBasePrisma = () => {
  if (!hasDatabaseUrl) {
    const unavailableDelegate = new Proxy({}, {
      get: () => async () => {
        throw new Error("DATABASE_URL is not configured.");
      },
    });
    let fallback;
    fallback = new Proxy({
      _dmmf: null,
      _runtimeDataModel: null,
      $extends: () => fallback,
      $connect: async () => undefined,
      $disconnect: async () => undefined,
      $executeRaw: async () => {
        throw new Error("DATABASE_URL is not configured.");
      },
      $queryRaw: async () => {
        throw new Error("DATABASE_URL is not configured.");
      },
    }, {
      get: (target, property) => property in target ? target[property] : unavailableDelegate,
    });
    return fallback;
  }

  const adapter = new PrismaPg({
    connectionString: withPoolLimits(process.env.DATABASE_URL),
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
  });
};

const basePrisma = globalThis.prisma || createBasePrisma();
globalThis.prisma = basePrisma;

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

const enforceTenantValue = (tenant, context = {}) => {
  const resolved = Number(tenant);
  if (!Number.isInteger(resolved) || resolved <= 0) {
    throw Object.assign(new Error(`Tenant context is required for ${context.model || "this operation"}`), {
      statusCode: 403,
    });
  }
  return resolved;
};

const WHERE_SCOPED_OPERATIONS = new Set([
  "findMany",
  "findUnique",
  "findFirst",
  "findFirstOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
]);

// Prisma's findUnique/update/delete require a unique selector. A tenant
// predicate cannot be injected into those selectors as an AND expression.
// PostgreSQL RLS is the tenant boundary for these unique operations.
const UNIQUE_SELECTOR_OPERATIONS = new Set([
  "findUnique",
  "update",
  "delete",
]);

export const scopeWhere = (where, tenant) => {
  const resolvedTenant = enforceTenantValue(tenant, { model: "tenant-query" });
  if (!where || typeof where !== "object" || Array.isArray(where)) return { schoolId: resolvedTenant };
  if (Object.prototype.hasOwnProperty.call(where, "schoolId")) {
    if (Number(where.schoolId) !== resolvedTenant) {
      throw Object.assign(new Error("Tenant mismatch: requested schoolId does not match the active tenant context."), {
        statusCode: 403,
      });
    }
    return { ...where, schoolId: resolvedTenant };
  }
  return { AND: [where, { schoolId: resolvedTenant }] };
};

const scopeOperationArgs = (model, operation, args, tenant) => {
  if (!tenant || !modelHasSchoolId(model)) return args;

  const resolvedTenant = enforceTenantValue(tenant, { model });
  const nextArgs = args ? { ...args } : {};

  if (WHERE_SCOPED_OPERATIONS.has(operation)) {
    // Do not turn a unique selector into an AND expression. The generated
    // Prisma client correctly accepts only id/userId/etc. for findUnique,
    // update and delete. RLS still enforces the active school boundary.
    nextArgs.where = UNIQUE_SELECTOR_OPERATIONS.has(operation)
      ? nextArgs.where
      : scopeWhere(nextArgs.where, resolvedTenant);
  }

  if ((operation === "create" || operation === "update") && nextArgs.data && !Array.isArray(nextArgs.data)) {
    nextArgs.data = scopeTenantData(nextArgs.data, resolvedTenant);
  }

  if ((operation === "createMany" || operation === "createManyAndReturn") && Array.isArray(nextArgs.data)) {
    nextArgs.data = nextArgs.data.map((item) => scopeTenantData(item, resolvedTenant));
  }

  if (operation === "upsert" && nextArgs.create) {
    nextArgs.create = scopeTenantData(nextArgs.create, resolvedTenant);
    if (nextArgs.update) nextArgs.update = scopeTenantData(nextArgs.update, resolvedTenant);
  }

  return nextArgs;
};

export const scopeTenantData = (data, tenant) => {
  const resolvedTenant = enforceTenantValue(tenant, { model: "tenant-write" });
  if (!data || typeof data !== "object") return data;
  if (Object.prototype.hasOwnProperty.call(data, "school")) {
    throw Object.assign(new Error("Nested school relation writes are not allowed in a tenant context"), {
      statusCode: 403,
    });
  }
  const { schoolId: _ignoredSchoolId, ...rest } = data;
  return { ...rest, schoolId: resolvedTenant };
};

const createTenantScopedClient = (client) => {
  if (typeof client?.$extends === "function") {
    return client.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const store = schoolContext.getStore();
            if (store?.skipTenant) return query(args);

            const tenant = store?.schoolId;
            return query(scopeOperationArgs(model, operation, args, tenant));
          },
        },
      },
    });
  }

  return new Proxy(client, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof property !== "string" || !modelHasSchoolId(property) || !value || typeof value !== "object") {
        return value;
      }

      return new Proxy(value, {
        get(delegate, operation, delegateReceiver) {
          const method = Reflect.get(delegate, operation, delegateReceiver);
          if (typeof method !== "function") return method;

          return (...args) => {
            const store = schoolContext.getStore();
            if (store?.skipTenant) return method(...args);

            const tenant = store?.schoolId;
            const nextArgs = scopeOperationArgs(property, operation, args[0], tenant);
            return method(nextArgs);
          };
        },
      });
    },
  });
};

const globalPrisma = createTenantScopedClient(basePrisma);
const TENANT_RAW_OPERATIONS = new Set(["$queryRaw", "$queryRawUnsafe", "$executeRaw", "$executeRawUnsafe"]);

const runTenantTransaction = async (callback, options) => {
  const store = schoolContext.getStore();
  const tenant = Number(store?.schoolId);
  if (store?.skipTenant || !Number.isInteger(tenant) || tenant <= 0) {
    return globalPrisma.$transaction(callback, options);
  }

  return basePrisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`SELECT set_config('app.current_school_id', ${String(tenant)}, true)`;
    const scopedTransaction = createTenantScopedClient(transaction);
    return schoolContext.run({ ...store, client: scopedTransaction }, () => callback(scopedTransaction));
  }, options);
};

const runTenantOperation = async (model, operation, args) => {
  const store = schoolContext.getStore();
  const tenant = Number(store?.schoolId);
  if (store?.client || store?.skipTenant || !Number.isInteger(tenant) || tenant <= 0 || !modelHasSchoolId(model)) {
    return globalPrisma[model][operation](...args);
  }

  return runTenantTransaction((transaction) => transaction[model][operation](...args));
};

const prisma = new Proxy(globalPrisma, {
  get(target, property, receiver) {
    const store = schoolContext.getStore();
    if (store?.client) return Reflect.get(store.client, property, receiver);

    if (property === "$transaction") {
      return (input, options) => {
        if (typeof input === "function") return runTenantTransaction(input, options);
        if (Array.isArray(input) && Number.isInteger(Number(store?.schoolId)) && !store?.skipTenant) {
          throw new Error("Array-form Prisma transactions are not supported in a tenant context; use an interactive transaction callback.");
        }
        return target.$transaction(input, options);
      };
    }

    if (TENANT_RAW_OPERATIONS.has(property)) {
      return (...args) => runTenantTransaction((transaction) => transaction[property](...args));
    }

    const value = Reflect.get(target, property, receiver);
    if (typeof property !== "string" || !modelHasSchoolId(property) || !value || typeof value !== "object") return value;

    return new Proxy(value, {
      get(delegate, operation, delegateReceiver) {
        const method = Reflect.get(delegate, operation, delegateReceiver);
        if (typeof method !== "function") return method;
        return (...args) => runTenantOperation(property, operation, args);
      },
    });
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
    if (process.env.NODE_ENV === "production") {
      const expectedRole = String(process.env.DATABASE_APP_ROLE || "").trim();
      if (!expectedRole) {
        throw new Error("DATABASE_APP_ROLE must name the non-owner PostgreSQL runtime role in production.");
      }

      const roleState = await basePrisma.$queryRaw`
        SELECT
          current_user AS "username",
          (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) AS "isSuperuser",
          (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) AS "bypassesRls",
          EXISTS (
            SELECT 1
            FROM pg_class table_info
            JOIN pg_namespace namespace_info ON namespace_info.oid = table_info.relnamespace
            WHERE namespace_info.nspname = 'public'
              AND table_info.relname IN ('Student', 'Grade', 'StudentFee', 'Payment')
              AND table_info.relowner = (SELECT oid FROM pg_roles WHERE rolname = current_user)
          ) AS "ownsProtectedTable"
      `;
      const current = roleState?.[0];
      if (!current || current.username !== expectedRole || current.isSuperuser || current.bypassesRls || current.ownsProtectedTable) {
        throw new Error("Database runtime role must be the configured non-superuser, non-owner application role.");
      }
    }
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Database error:", {
      name: err?.name,
      code: err?.code,
      meta: err?.meta,
      message: err?.message,
      cause: err?.cause,
      stack: err?.stack,
    });
    throw err;
  }
};

const disconnectDB = async () => {
  await prisma.$disconnect();
};

export { prisma, connectDB, disconnectDB };
