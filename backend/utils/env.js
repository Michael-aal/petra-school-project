import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  DATABASE_URL: z.string().url().min(1),
  JWT_SECRET: z.string().min(1),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
}).superRefine((values, context) => {
  if (values.NODE_ENV === "production" && values.JWT_SECRET.length < 32) {
    context.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 32,
      inclusive: true,
      type: "string",
      path: ["JWT_SECRET"],
      message: "JWT_SECRET must be at least 32 characters in production.",
    });
  }
});

const result = environmentSchema.safeParse(process.env);
if (!result.success) {
  console.error("Invalid runtime environment:", result.error.flatten().fieldErrors);
  throw new Error("Runtime environment validation failed.");
}

export const env = result.data;
