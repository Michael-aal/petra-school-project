import { PrismaClient } from "@prisma/client";

type StudentResult = {
  parentEmail: string | null;
  parentPhone: string | null;
  nationalId?: string | null;
};

const maskEmail = (value: string | null | undefined): string | null | undefined => {
  if (!value) return value;
  const at = value.indexOf("@");
  if (at <= 0 || at === value.length - 1) return "***";
  return `${value[0]}***${value.slice(at)}`;
};

const maskPhone = (value: string | null | undefined): string | null | undefined => {
  if (!value) return value;
  return `${"*".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
};

const maskNationalId = (value: string | null | undefined): string | null | undefined => {
  if (!value) return value;
  return `${"*".repeat(Math.max(0, value.length - 2))}${value.slice(-2)}`;
};

const maskReturnedPii = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(maskReturnedPii);
  if (!value || typeof value !== "object") return value;

  const record = value as Record<string, unknown>;
  const masked = Object.fromEntries(
    Object.entries(record).map(([key, child]) => {
      if (key === "email") return [key, maskEmail(typeof child === "string" ? child : null)];
      if (key === "phone") return [key, maskPhone(typeof child === "string" ? child : null)];
      if (key === "nationalId") return [key, maskNationalId(typeof child === "string" ? child : null)];
      return [key, maskReturnedPii(child)];
    }),
  );
  return masked;
};

const extendClient = (client: PrismaClient, schoolId?: number) =>
  client.$extends({
    result: {
      student: {
        email: {
          needs: { parentEmail: true },
          compute(student: StudentResult): string | null | undefined {
            return maskEmail(student.parentEmail);
          },
        },
        phone: {
          needs: { parentPhone: true },
          compute(student: StudentResult): string | null | undefined {
            return maskPhone(student.parentPhone);
          },
        },
        nationalId: {
          needs: { id: true },
          compute(): undefined {
            return undefined;
          },
        },
      },
    },
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          if (schoolId !== undefined) {
            await client.$executeRaw`SELECT set_config('app.current_school_id', ${String(schoolId)}, false)`;
          }
          return maskReturnedPii(await query(args));
        },
      },
    },
  });

export const prisma = new PrismaClient();
export const db = extendClient(prisma);

export const getTenantDb = (client: PrismaClient, schoolId: number) =>
  extendClient(client, schoolId);
