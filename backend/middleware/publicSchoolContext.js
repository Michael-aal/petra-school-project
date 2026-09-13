import { prisma, runWithSchoolContext } from "../config/db.js";

const parseSchoolId = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

// Public endpoints have no authenticated tenant to derive from. Requiring the
// school id makes their tenancy explicit, then pins all following DB work to it.
export const requirePublicSchoolContext = (source = "body") => async (req, res, next) => {
  const requestedSchoolId = parseSchoolId(req[source]?.schoolId);
  if (!requestedSchoolId) {
    return res.status(400).json({ success: false, message: "A valid schoolId is required." });
  }

  if (req.schoolId && Number(req.schoolId) !== requestedSchoolId) {
    return res.status(403).json({ success: false, message: "The requested school does not match your account." });
  }

  const school = await prisma.school.findFirst({
    where: { id: requestedSchoolId, isActive: true },
    select: { id: true },
  });
  if (!school) {
    return res.status(404).json({ success: false, message: "The requested school is not available." });
  }

  req.schoolId = school.id;
  return runWithSchoolContext(school.id, next);
};
