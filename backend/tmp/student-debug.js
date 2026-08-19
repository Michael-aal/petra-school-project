import "../config/loadEnv.js";
import { prisma } from '../config/db.js';

const main = async () => {
  try {
    const latest = await prisma.student.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        profile: true,
        medicalInfo: true,
        parents: true,
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
    console.log('LATEST_STUDENTS', JSON.stringify(latest, null, 2));
    const count = await prisma.student.count();
    console.log('STUDENT_COUNT', count);
  } catch (error) {
    console.error('ERROR', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

main();
