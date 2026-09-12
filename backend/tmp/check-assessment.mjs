import { prisma } from './config/db.js';
const rows = await prisma.assessment.findMany({ select: { id: true, title: true, quizlabQuizId: true, schoolId: true }, take: 50 });
console.log(JSON.stringify(rows, null, 2));
await prisma.$disconnect();
