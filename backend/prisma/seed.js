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

async function seedBaseline() {
  let school = await prisma.school.findFirst({ where: { name: "Petra School", country: "Nigeria" } });
  if (!school) {
    school = await prisma.school.create({ data: { name: "Petra School", country: "Nigeria", isActive: true } });
  }

  const academicYear = await prisma.academicYear.upsert({
    where: { schoolId_name: { schoolId: school.id, name: "2026/2027" } },
    update: { isActive: true },
    create: {
      schoolId: school.id,
      name: "2026/2027",
      startsAt: new Date("2026-09-01T00:00:00.000Z"),
      endsAt: new Date("2027-07-31T23:59:59.999Z"),
      isActive: true,
    },
  });
  await prisma.term.upsert({
    where: { academicYearId_name: { academicYearId: academicYear.id, name: "First Term" } },
    update: { isActive: true },
    create: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      name: "First Term",
      startsAt: new Date("2026-09-01T00:00:00.000Z"),
      endsAt: new Date("2026-12-18T23:59:59.999Z"),
      isActive: true,
    },
  });

  const permissions = [
    ["students:read", "Read student records"],
    ["students:write", "Create and update student records"],
    ["payments:read", "Read payment records"],
    ["payments:write", "Create and update payment records"],
  ];
  const permissionRows = [];
  for (const [code, description] of permissions) {
    permissionRows.push(await prisma.permission.upsert({
      where: { code },
      update: { description },
      create: { name: code, code, description, schoolId: school.id },
    }));
  }
  for (const roleName of ["principal", "teacher", "parent"]) {
    const role = await prisma.role.upsert({
      where: { schoolId_name: { schoolId: school.id, name: roleName } },
      update: { displayName: roleName[0].toUpperCase() + roleName.slice(1) },
      create: { schoolId: school.id, name: roleName, displayName: roleName[0].toUpperCase() + roleName.slice(1) },
    });
    for (const permission of permissionRows) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }
  console.log(`Baseline data ready for school ${school.id}.`);
}

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
    await seedBaseline();
    if (process.env.SUPERADMIN_EMAIL && process.env.SUPERADMIN_PASSWORD) await seedSuperAdmin();
    else console.log("SUPERADMIN_EMAIL/PASSWORD not supplied; skipping super-admin user.");
    console.log("Seed completed successfully.");
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
