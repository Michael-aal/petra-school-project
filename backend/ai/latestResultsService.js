import { prisma } from "../config/db.js";
import { assertSchoolAccess, assertStudentAccess, getSchoolId } from "../utils/authorization.js";
import { normalizeRole } from "../utils/roleUtils.js";
import { parentAccessService } from "../services/parentAccessService.js";

const resolveStudent = async (user, studentId, schoolId) => {
  const role = normalizeRole(user?.role);

  if (studentId) {
    return assertStudentAccess(user, String(studentId), { schoolId });
  }

  if (role === "student") {
    const student = await prisma.student.findFirst({
      where: {
        schoolId,
        OR: [
          { userId: user.id },
          ...(user?.linkedStudentId ? [{ id: String(user.linkedStudentId) }] : []),
        ],
      },
      select: { id: true, name: true, className: true },
    });
    if (!student) throw Object.assign(new Error("No student record found for your account"), { statusCode: 404 });
    return student;
  }

  if (role === "parent" || role === "guardian") {
    const children = await parentAccessService.listChildren(user.id, schoolId);
    if (!children.length) {
      throw Object.assign(new Error("No student is currently linked to your account."), { statusCode: 404 });
    }
    return children[0];
  }

  throw Object.assign(new Error("A studentId parameter is required for this query"), { statusCode: 400 });
};

export const getLatestStudentResults = async ({ user, schoolId, studentId, limit = 10 }) => {
  const resolvedSchoolId = assertSchoolAccess(user, schoolId ?? getSchoolId(user));
  const student = await resolveStudent(user, studentId, resolvedSchoolId);
  const take = Math.max(1, Math.min(25, Number(limit) || 10));

  const [continuousResults, examResults] = await Promise.all([
    prisma.result.findMany({
      where: {
        schoolId: resolvedSchoolId,
        studentId: String(student.id),
        published: true,
      },
      select: {
        subject: true,
        score: true,
        maxScore: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take,
    }),
    prisma.examResult.findMany({
      where: {
        studentId: String(student.id),
        exam: { schoolId: resolvedSchoolId },
      },
      select: {
        marks: true,
        percentage: true,
        grade: true,
        remarks: true,
        createdAt: true,
        exam: { select: { title: true, totalMarks: true, examDate: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
    }),
  ]);

  const results = [
    ...continuousResults.map((result) => {
      const score = Number(result.score) || 0;
      const maxScore = Number(result.maxScore) || 100;
      return {
        type: "result",
        subject: result.subject || "Subject",
        score,
        maxScore,
        percentage: Number(((score / maxScore) * 100).toFixed(1)),
        date: result.createdAt?.toISOString?.() || null,
      };
    }),
    ...examResults.map((result) => ({
      type: "exam",
      subject: result.exam?.title || "Exam",
      score: Number(result.marks) || 0,
      maxScore: Number(result.exam?.totalMarks) || 100,
      percentage: result.percentage == null
        ? Number((((Number(result.marks) || 0) / (Number(result.exam?.totalMarks) || 100)) * 100).toFixed(1))
        : Number(result.percentage),
      grade: result.grade || null,
      remarks: result.remarks || null,
      date: (result.exam?.examDate || result.createdAt)?.toISOString?.() || null,
    })),
  ]
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .slice(0, take);

  return {
    studentId: student.id,
    studentName: student.name || student.fullName || "Student",
    className: student.className || "",
    count: results.length,
    results,
    message: results.length ? undefined : "No published results are currently available for this student.",
  };
};
