#!/usr/bin/env node
// One-off repair script to audit and fix Parent-Student relationships
// Usage: node scripts/repair-parent-student.js

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Starting parent-student repair...');

  // 1) Remove orphaned StudentParent entries (parent or student missing)
  const links = await prisma.studentParent.findMany({ select: { id: true, studentId: true, parentId: true } });
  let removed = 0;
  for (const link of links) {
    const student = await prisma.student.findUnique({ where: { id: link.studentId } });
    const parent = await prisma.parent.findUnique({ where: { id: link.parentId } });
    if (!student || !parent) {
      console.log(`Removing orphaned link ${link.id} (student=${link.studentId} parent=${link.parentId})`);
      await prisma.studentParent.delete({ where: { id: link.id } });
      removed++;
    }
  }
  console.log(`Orphaned links removed: ${removed}`);

  // 2) Ensure students with parentId set have a StudentParent row
  const studentsWithParent = await prisma.student.findMany({ where: { parentId: { not: null } }, select: { id: true, parentId: true } });
  let created = 0;
  for (const s of studentsWithParent) {
    const parentUserId = s.parentId; // this is a userId
    const parentRecord = await prisma.parent.findFirst({ where: { userId: parentUserId } });
    if (!parentRecord) {
      console.log(`No Parent record for student ${s.id} user parentId=${parentUserId} - creating Parent record`);
      const user = await prisma.user.findUnique({ where: { id: parentUserId } });
      if (user) {
        const newParent = await prisma.parent.create({ data: { userId: user.id, schoolId: (await prisma.school.findFirst())?.id || 1, name: user.fullName || user.email, phone: user.phone || null, email: user.email } });
        await prisma.studentParent.upsert({ where: { studentId_parentId: { studentId: s.id, parentId: newParent.id } }, update: {}, create: { studentId: s.id, parentId: newParent.id } });
        created++;
        continue;
      }
      console.warn(`Cannot create Parent record: user ${parentUserId} not found`);
      continue;
    }

    const exists = await prisma.studentParent.findUnique({ where: { studentId_parentId: { studentId: s.id, parentId: parentRecord.id } } }).catch(() => null);
    if (!exists) {
      console.log(`Creating missing StudentParent link for student ${s.id} -> parent ${parentRecord.id}`);
      await prisma.studentParent.create({ data: { studentId: s.id, parentId: parentRecord.id } });
      created++;
    }
  }
  console.log(`Missing StudentParent links created: ${created}`);

  // 3) For users with linkedStudentId set, ensure parent record and StudentParent exist
  const usersWithLinked = await prisma.user.findMany({ where: { linkedStudentId: { not: null } }, select: { id: true, linkedStudentId: true } });
  let fixed = 0;
  for (const u of usersWithLinked) {
    const student = await prisma.student.findUnique({ where: { id: u.linkedStudentId } });
    if (!student) {
      console.warn(`User ${u.id} has linkedStudentId ${u.linkedStudentId} but student not found`);
      continue;
    }
    let parentRecord = await prisma.parent.findFirst({ where: { userId: u.id } });
    if (!parentRecord) {
      console.log(`Creating Parent record for user ${u.id}`);
      parentRecord = await prisma.parent.create({ data: { userId: u.id, schoolId: student.schoolId, name: (await prisma.user.findUnique({ where: { id: u.id } }))?.fullName || '', email: (await prisma.user.findUnique({ where: { id: u.id } }))?.email || '' } });
      fixed++;
    }
    const exists = await prisma.studentParent.findUnique({ where: { studentId_parentId: { studentId: student.id, parentId: parentRecord.id } } }).catch(() => null);
    if (!exists) {
      console.log(`Creating StudentParent for student ${student.id} and parent ${parentRecord.id}`);
      await prisma.studentParent.create({ data: { studentId: student.id, parentId: parentRecord.id } });
      fixed++;
    }
  }
  console.log(`Linked-student fixes applied: ${fixed}`);

  console.log('Repair complete.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
