import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  DATABASE_URL: z.string().url().min(1),
  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
  JWT_KEY_ID: z.string().min(1).default("petra-2026"),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  ORIGIN_SECRET: z.string().min(1),
  REDIS_URL: z.string().url().default("redis://127.0.0.1:6379"),
}).superRefine((values, context) => {
  if (values.NODE_ENV === "production" && values.JWT_PRIVATE_KEY.length < 32) {
    context.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 32,
      inclusive: true,
      type: "string",
      path: ["JWT_PRIVATE_KEY"],
      message: "JWT_PRIVATE_KEY must be configured in production.",
    });
  }
});

const result = environmentSchema.safeParse(process.env);
if (!result.success) {
  console.error("Invalid runtime environment:", result.error.flatten().fieldErrors);
  throw new Error("Runtime environment validation failed.");
}

export const env = result.data;
