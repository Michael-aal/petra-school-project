import { z } from "zod";

const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters long")
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
    confirmPassword: z.string().min(12, "Confirm password must match the password policy"),
    role: z.enum(["principal", "staff", "parent"]),
    institution: z.string().trim().max(120, "Institution name is too long").optional().or(z.literal("")),
    institutionType: z.string().trim().max(60, "Institution type is too long").optional().or(z.literal("")),
    state: z.string().trim().max(60, "State is too long").optional().or(z.literal("")),
    city: z.string().trim().max(60, "City is too long").optional().or(z.literal("")),
    hearAbout: z.string().trim().max(120, "This field is too long").optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

const validateWithZod = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.issues.map((issue) => ({
        path: issue.path.join(".") || "body",
        msg: issue.message,
      })),
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
