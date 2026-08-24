import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
try {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, schoolId: true, selectedSchoolId: true, fullName: true },
    take: 20,
  });
  console.log(JSON.stringify(users, null, 2));
} finally {
  await prisma.$disconnect();
}
