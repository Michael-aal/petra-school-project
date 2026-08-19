import "../config/loadEnv.js";
import { prisma, connectDB, disconnectDB } from "../config/db.js";
import { hashPassword } from "../utils/hashPassword.js";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const normalizeUsername = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");

const buildNameParts = (email) => {
  const localPart = String(email || "")
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim();

  const parts = localPart.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "Super";
  const lastName = parts.slice(1).join(" ") || "Admin";
  const fullName = `${firstName} ${lastName}`.trim();

  return { firstName, lastName, fullName };
};

const getRequiredEnv = (name) => {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`${name} is missing. Add it to backend/.env before running the seed.`);
  }
  return String(value).trim();
};

async function seedSuperAdmin() {
  const email = normalizeEmail(getRequiredEnv("SUPERADMIN_EMAIL"));
  const password = getRequiredEnv("SUPERADMIN_PASSWORD");
  const username = normalizeUsername(process.env.SUPERADMIN_USERNAME || email.split("@")[0] || "superadmin");
  const { firstName, lastName, fullName } = buildNameParts(email);
  const role = "superadmin";

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log("SuperAdmin already exists. Skipping seed.");
    return existing;
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      fullName,
      username,
      email,
      password: passwordHash,
      role,
      schoolId: null,
      accountStatus: "active",
    },
  });

  console.log("SuperAdmin seeded successfully.");
  return user;
}

async function main() {
  await connectDB();

  try {
    await seedSuperAdmin();
    console.log("Seed completed successfully.");
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
