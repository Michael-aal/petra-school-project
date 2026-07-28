import { connectDB, disconnectDB, prisma } from "../config/db.js";
import bcrypt from "bcryptjs";

async function seedSchool() {
  const school = await prisma.school.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Petra School",
      address: "Main Campus",
      timezone: "Africa/Lagos",
    },
  });

  console.log("✓ School seeded");

  return school;
}

async function seedSettings(school) {
  await prisma.settings.upsert({
    where: {
      schoolId_key: {
        schoolId: school.id,
        key: "default_currency",
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      key: "default_currency",
      value: "NGN",
    },
  });

  console.log("✓ Settings seeded");
}

async function seedRoles(school) {
  const roles = [
    "Super Admin",
    "Admin",
    "Principal",
    "Vice Principal",
    "Teacher",
    "Staff",
    "Parent",
    "Guardian",
    "Student",
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: {
        schoolId_name: {
          schoolId: school.id,
          name: role,
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        name: role,
      },
    });
  }

  console.log("✓ Roles seeded");
}

async function seedAdmin(school) {
  const password = await bcrypt.hash("Admin@123", 12);

  await prisma.user.upsert({
    where: {
      email: "admin@petra.com",
    },
    update: {},
    create: {
      schoolId: school.id,
      firstName: "System",
      lastName: "Administrator",
      fullName: "System Administrator",
      username: "superadmin",
      email: "admin@petra.com",
      password: password,
      role: "SUPER_ADMIN",
    },
  });

  console.log("✓ Super Admin seeded");
}

async function seedAcademic(school) {
  await prisma.academicYear.upsert({
    where: {
      schoolId_name: {
        schoolId: school.id,
        name: "2026/2027",
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: "2026/2027",
      isCurrent: true,
    },
  });

  console.log("✓ Academic Year seeded");
}

async function seedFinance(school) {
  const categories = [
    "School Fees",
    "Examination",
    "Development Levy",
    "Library",
    "Transport",
    "Hostel",
  ];

  for (const category of categories) {
    await prisma.feeCategory.upsert({
      where: {
        schoolId_name: {
          schoolId: school.id,
          name: category,
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        name: category,
      },
    });
  }

  console.log("✓ Finance seeded");
}

async function main() {
  await connectDB();

  const school = await seedSchool();

  await seedSettings(school);
  await seedRoles(school);
  await seedAdmin(school);
  await seedAcademic(school);
  await seedFinance(school);

  console.log("✅ Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });