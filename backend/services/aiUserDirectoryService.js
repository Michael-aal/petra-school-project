import { prisma } from "../config/db.js";
import { assertSchoolAccess, getSchoolId } from "../utils/authorization.js";

/**
 * Returns only non-sensitive identity information for users in the
 * authenticated user's school. Secrets, credentials, contact details and
 * authentication fields are intentionally excluded.
 */
export const getUserDirectory = async ({ user, schoolId, search, role, limit = 50 }) => {
  const resolvedSchoolId = assertSchoolAccess(user, schoolId ?? getSchoolId(user));
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const normalizedSearch = String(search || "").trim();

  const rows = await prisma.user.findMany({
    where: {
      schoolId: resolvedSchoolId,
      ...(role ? { role: String(role).trim().toLowerCase() } : {}),
      ...(normalizedSearch
        ? {
            OR: [
              { fullName: { contains: normalizedSearch, mode: "insensitive" } },
              { firstName: { contains: normalizedSearch, mode: "insensitive" } },
              { lastName: { contains: normalizedSearch, mode: "insensitive" } },
              { username: { contains: normalizedSearch, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      fullName: true,
      firstName: true,
      lastName: true,
      username: true,
      role: true,
      accountStatus: true,
    },
    orderBy: [{ fullName: "asc" }, { firstName: "asc" }],
    take: safeLimit,
  });

  return {
    schoolId: resolvedSchoolId,
    count: rows.length,
    users: rows.map((row) => ({
      id: row.id,
      name: row.fullName || `${row.firstName || ""} ${row.lastName || ""}`.trim() || row.username,
      firstName: row.firstName,
      lastName: row.lastName,
      username: row.username,
      role: row.role,
      accountStatus: row.accountStatus,
    })),
  };
};
