import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must be at most 128 characters long")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter")
  .regex(/[a-z]/, "Password must include at least one lowercase letter")
  .regex(/[0-9]/, "Password must include at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must include at least one special character");

const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters long")
  .max(32, "Username must be at most 32 characters long")
  .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, dots, underscores, and hyphens");

const namePartSchema = z
  .string()
  .trim()
  .min(1, "This field is required")
  .max(80, "This field is too long")
  .regex(/^[a-zA-ZÀ-ÿ' -]+$/, "Only letters, spaces, hyphens, and apostrophes are allowed");

const emailSchema = z.string().trim().email("Valid email is required").max(254, "Email is too long").toLowerCase();

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number is required")
  .max(20, "Phone number is too long")
  .regex(/^[+0-9()\-\s]+$/, "Phone number contains invalid characters");

const registerSchema = z
  .object({
    firstName: namePartSchema,
    middleName: z.string().trim().max(80, "Middle name is too long").optional().or(z.literal("")),
    lastName: namePartSchema,
    username: usernameSchema,
    email: emailSchema,
    phone: phoneSchema.optional().or(z.literal("")),
    password: passwordSchema,
    confirmPassword: z.string().min(8, "Confirm password must match the password policy").max(128, "Confirm password must be at most 128 characters long"),
    role: z.string().trim().min(1, "Please select a role").transform((value) => value.toLowerCase()),
    institution: z.string().trim().max(120, "Institution name is too long").optional().or(z.literal("")),
    institutionType: z.string().trim().max(60, "Institution type is too long").optional().or(z.literal("")),
    state: z.string().trim().max(60, "State is too long").optional().or(z.literal("")),
    city: z.string().trim().max(60, "City is too long").optional().or(z.literal("")),
    hearAbout: z.string().trim().max(120, "This field is too long").optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    const allowedRoles = ["student", "teacher", "parent", "principal", "school_admin", "school administrator", "school-admin", "schooladministrator", "school_administrator"];

    if (!allowedRoles.includes(value.role)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["role"],
        message: "Please select a supported role",
      });
    }

    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

const validateWithZod = (schema) => (req, res, next) => {
  // Debug: log incoming request body to help identify missing/undefined fields
  // (temporary - remove after fixing the validation issue)
  try {
    console.log("[ZOD VALIDATION] incoming request body:", JSON.stringify(req.body));
  } catch (err) {
    console.log("[ZOD VALIDATION] incoming request body (unserializable):", req.body);
  }

  const result = schema.safeParse(req.body);
  if (!result.success) {
    // Log detailed zod error to help identify which field failed validation
    const formatted = result.error.format ? result.error.format() : result.error;
    console.error("[ZOD VALIDATION] errors:", formatted);

    const issues = result.error.issues.map((issue) => ({
      path: issue.path.join(".") || "body",
      msg: issue.message,
    }));

    // Build a short human-friendly message using the first issue
    const first = issues[0];
    const topMessage = first ? `${first.path}: ${first.msg}` : "Validation failed";

    return res.status(400).json({
      success: false,
      message: topMessage,
      errors: issues,
      // include a debug object during development to aid diagnosis (remove in production)
      debug: process.env.NODE_ENV === "development" ? { zod: formatted } : undefined,
    });
  }

  req.body = result.data;
  return next();
};

export const registerValidator = validateWithZod(registerSchema);
export const loginValidator = validateWithZod(
  z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
  }),
);
export const staffInvitationValidator = validateWithZod(
  z.object({
    staffName: namePartSchema,
    email: emailSchema,
    role: z.string().trim().min(1, "Staff role is required"),
    department: z.string().trim().min(1, "Department is required"),
    employmentStatus: z.enum(["active", "inactive"]).optional(),
  }),
);
export const staffActivationValidator = validateWithZod(
  z.object({
    email: emailSchema,
    password: passwordSchema,
    code: z.string().trim().min(1, "Staff registration code is required"),
  }),
);
