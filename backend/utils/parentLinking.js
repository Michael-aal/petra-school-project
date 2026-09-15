import { prisma } from "../config/db.js";

export const normalizeParentEmail = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized;
};

export const findStudentsForParentEmail = (students = [], parentEmail = "") => {
  const normalizedParentEmail = normalizeParentEmail(parentEmail);
  if (!normalizedParentEmail) return [];

  return students.filter((student) => normalizeParentEmail(student?.parentEmail) === normalizedParentEmail);
};

export const linkParentToMatchingChildren = async ({ parentUserId, schoolId, email } = {}) => {
  const normalizedEmail = normalizeParentEmail(email);
  const resolvedSchoolId = Number(schoolId);
  if (!parentUserId || !normalizedEmail || !Number.isInteger(resolvedSchoolId) || resolvedSchoolId <= 0) {
    return { linkedChildren: 0, studentIds: [] };
  }

  const [students, admissions] = await Promise.all([
    prisma.student.findMany({
      where: { schoolId: resolvedSchoolId, parentEmail: normalizedEmail },
      select: { id: true },
    }),
    prisma.admission.findMany({
      where: {
        schoolId: resolvedSchoolId,
        studentId: { not: null },
        OR: [
          { parentEmail: { equals: normalizedEmail, mode: "insensitive" } },
          { fatherEmail: { equals: normalizedEmail, mode: "insensitive" } },
          { motherEmail: { equals: normalizedEmail, mode: "insensitive" } },
        ],
      },
      select: { studentId: true },
    }),
  ]);

  const studentIds = [...new Set([
    ...students.map((student) => student.id),
    ...admissions.map((admission) => admission.studentId).filter(Boolean),
  ])];
  if (!studentIds.length) return { linkedChildren: 0, studentIds: [] };

  const parent = await prisma.parent.findFirst({ where: { userId: parentUserId, schoolId: resolvedSchoolId } });
  if (!parent) return { linkedChildren: 0, studentIds: [] };

  await prisma.$transaction(async (tx) => {
    for (const studentId of studentIds) {
      await tx.studentParent.upsert({
        where: { studentId_parentId: { studentId, parentId: parent.id } },
        update: {},
        create: { studentId, parentId: parent.id, relation: "parent" },
      });
    }

    const parentWithoutLegacyLink = await tx.user.findUnique({
      where: { id: parentUserId },
      select: { linkedStudentId: true },
    });
    if (!parentWithoutLegacyLink?.linkedStudentId) {
      await tx.user.update({
        where: { id: parentUserId },
        data: { linkedStudentId: studentIds[0] },
      });
    }

    await tx.student.updateMany({
      where: { id: { in: studentIds }, schoolId: resolvedSchoolId, parentId: null },
      data: { parentId: parentUserId },
    });
  });

  return { linkedChildren: studentIds.length, studentIds };
};
