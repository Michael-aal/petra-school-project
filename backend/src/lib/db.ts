import { PrismaClient } from "@prisma/client";

type MaskableRecord = Record<string, unknown>;

const maskEmail = (value: string): string => {
  const separator = value.indexOf("@");
  if (separator <= 0 || separator === value.length - 1) return "***";
  return `${value[0]}***${value.slice(separator)}`;
};

const maskPhone = (value: string): string => {
  const visibleDigits = value.slice(-4);
  return `${"*".repeat(Math.max(0, value.length - 4))}${visibleDigits}`;
};

const maskValue = (key: string, value: string): string => {
  switch (key.toLowerCase()) {
    case "email":
      return maskEmail(value);
    case "phone":
      return maskPhone(value);
    case "nationalid":
      return "***-**-****";
    default:
      return value;
  }
};

const maskPii = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(maskPii);
  if (!value || typeof value !== "object") return value;

  const masked: MaskableRecord = {};
  for (const [key, child] of Object.entries(value)) {
    masked[key] =
      typeof child === "string" &&
      ["email", "phone", "nationalid"].includes(key.toLowerCase())
        ? maskValue(key, child)
        : maskPii(child);
  }
  return masked;
};

export const getTenantDb = (client: PrismaClient, schoolId: number) =>
  client.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          await client.$executeRaw`SELECT set_config('app.current_school_id', ${String(schoolId)}, false)`;
          const result = await query(args);
          return maskPii(result);
        },
      },
    },
  });
