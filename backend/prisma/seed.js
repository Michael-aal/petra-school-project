import { connectDB, disconnectDB, prisma } from '../config/db.js';

async function main() {
  await connectDB();

  const school = await prisma.school.create({
    data: {
      name: 'Petra School',
      address: 'Main Campus',
      timezone: 'Africa/Lagos',
    },
  });

  await prisma.settings.upsert({
    where: { schoolId_key: { schoolId: school.id, key: 'default_currency' } },
    update: {},
    create: {
      schoolId: school.id,
      key: 'default_currency',
      value: 'NGN',
    },
  });

  console.log('Seed data installed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });
