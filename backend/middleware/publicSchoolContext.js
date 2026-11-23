import { prisma, runWithSchoolContext } from "../config/db.js";
import { verifyApplicationLinkToken } from "../utils/applicationLinkToken.js";

const parseSchoolId = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

// Public application submissions use signed school links. Legacy schoolId
// support remains for existing integrations while new portal links use tokens.
export const requirePublicSchoolContext = (source = "body", expectedType = null) => async (req, res, next) => {
  const token = req[source]?.applicationToken || req.params?.token || req.query?.token;
  const tokenContext = token ? verifyApplicationLinkToken(token, expectedType) : null;
  if (token && !tokenContext) {
    return res.status(403).json({ success: false, message: "This application link is invalid or has the wrong application type." });
  }

  const requestedSchoolId = tokenContext?.schoolId || (req.user ? parseSchoolId(req.user.schoolId || req.schoolId || req[source]?.schoolId) : (!expectedType ? parseSchoolId(req[source]?.schoolId) : null));
  if (!requestedSchoolId) {
    return res.status(400).json({ success: false, message: "Open this form using the school's official application link." });
  }

  if (!tokenContext && req.user && req.schoolId && Number(req.schoolId) !== requestedSchoolId) {
    return res.status(403).json({ success: false, message: "The requested school does not match your account." });
  }

  const school = await prisma.school.findFirst({
    where: { id: requestedSchoolId, isActive: true },
    select: { id: true },
  });
  if (!school) {
    return res.status(404).json({ success: false, message: "The selected school is not available." });
  }

  if (expectedType && tokenContext && tokenContext.type !== expectedType) {
    return res.status(403).json({ success: false, message: "This link is not valid for this application form." });
  }

  req.schoolId = school.id;
  req.applicationType = tokenContext?.type || null;
  return runWithSchoolContext(school.id, next);
};
