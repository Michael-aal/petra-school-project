import '../config/loadEnv.js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

try {
  await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "selectedSchoolId" INTEGER;');
  await prisma.$executeRawUnsafe(`DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'User_selectedSchoolId_fkey'
      ) THEN
        ALTER TABLE "User"
          ADD CONSTRAINT "User_selectedSchoolId_fkey"
          FOREIGN KEY ("selectedSchoolId") REFERENCES "School"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$;`);
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "User_selectedSchoolId_idx" ON "User"("selectedSchoolId");');
  console.log('selectedSchoolId schema ensured');

  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, schoolId: true, selectedSchoolId: true, fullName: true },
    take: 10,
  });
  console.log(JSON.stringify(users, null, 2));
} finally {
  await prisma.$disconnect();
}
