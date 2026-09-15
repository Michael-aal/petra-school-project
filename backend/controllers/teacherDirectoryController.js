import { prisma } from "../config/db.js";

const resolveSchoolId = (user) => {
  const candidates = [
    user?.schoolId,
    user?.principalProfile?.schoolId,
    user?.adminProfile?.schoolId,
    user?.teacherProfile?.schoolId,
    user?.staffProfile?.schoolId,
  ];
  return candidates.map(Number).find((value) => Number.isInteger(value) && value > 0) || null;
};

const buildTeacherDirectoryRecord = (teacher, includeSensitiveFields = false) => {
  const base = {
    ...teacher.user,
    id: teacher.id,
    userId: teacher.user?.id || null,
    schoolId: teacher.schoolId,
    designation: teacher.designation || teacher.user?.staffRole || "Teacher",
    isActive: teacher.isActive,
    createdAt: teacher.createdAt,
    department: teacher.department || null,
  };

  if (!includeSensitiveFields) {
    delete base.email;
    delete base.staffRegistrationCode;
    delete base.staffRegistrationCodeUsed;
    delete base.password;
    delete base.refreshToken;
    delete base.accessToken;
    delete base.token;
  } else {
    base.registrationCode = teacher.user?.staffRegistrationCode || null;
    base.registrationCodeUsed = Boolean(teacher.user?.staffRegistrationCodeUsed);
  }

  return base;
};

export const listTeacherDirectory = async (req, res, next) => {
  try {
    const schoolId = resolveSchoolId(req.user);
    if (!schoolId) return res.status(403).json({ success: false, message: "School context missing" });

    const search = String(req.query.search || "").trim();
    const parsedLimit = Number(req.query.limit || 50);
    const limit = Math.min(Math.max(Number.isInteger(parsedLimit) ? parsedLimit : 50, 1), 200);
    const includeSensitiveFields = String(req.query.includeSensitive || "").trim() === "1";

    const teachers = await prisma.teacher.findMany({
      where: {
        schoolId,
        user: {
          role: "teacher",
          ...(search ? { OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { username: { contains: search, mode: "insensitive" } },
            { staffRegistrationCode: { contains: search, mode: "insensitive" } },
          ] } : {}),
        },
      },
      include: {
        user: {
          select: {
            id: true, fullName: true, firstName: true, lastName: true, email: true,
            username: true, role: true, accountStatus: true, staffRole: true,
            staffDepartment: true, staffClassAssigned: true, staffSubjectsAssigned: true,
            staffRegistrationCode: true, staffRegistrationCodeUsed: true,
          },
        },
        department: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return res.json({
      success: true,
      teachers: teachers.map((teacher) => buildTeacherDirectoryRecord(teacher, includeSensitiveFields)),
    });
  } catch (error) {
    return next(error);
  }
};
