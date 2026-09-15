import { prisma } from "../config/db.js";

export const listTeacherDirectory = async (req, res, next) => {
  try {
    const schoolId = Number(req.user?.schoolId);
    if (!Number.isInteger(schoolId) || schoolId <= 0) {
      return res.status(403).json({ success: false, message: "School context missing" });
    }

    const search = String(req.query.search || "").trim();
    const parsedLimit = Number(req.query.limit || 50);
    const limit = Math.min(Math.max(Number.isInteger(parsedLimit) ? parsedLimit : 50, 1), 200);

    const where = {
      schoolId,
      user: {
        role: "teacher",
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: "insensitive" } },
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { username: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
    };

    const teachers = await prisma.teacher.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
            role: true,
            accountStatus: true,
            staffRole: true,
            staffDepartment: true,
            staffClassAssigned: true,
            staffSubjectsAssigned: true,
          },
        },
        department: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return res.json({
      success: true,
      teachers: teachers.map((teacher) => ({
        id: teacher.id,
        userId: teacher.user?.id || null,
        schoolId: teacher.schoolId,
        designation: teacher.designation || teacher.user?.staffRole || "Teacher",
        isActive: teacher.isActive,
        createdAt: teacher.createdAt,
        department: teacher.department || null,
        ...teacher.user,
      })),
    });
  } catch (error) {
    return next(error);
  }
};
