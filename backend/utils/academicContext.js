import { prisma } from "../config/db.js";

const invalidContext = (message) => Object.assign(new Error(message), { statusCode: 400 });

export const resolveAcademicContext = async (schoolId, query = {}) => {
  const requestedYearId = query.academicYearId ? String(query.academicYearId) : null;
  const requestedTermId = query.termId ? String(query.termId) : null;
  const academicYear = await prisma.academicYear.findFirst({
    where: { schoolId, ...(requestedYearId ? { id: requestedYearId } : { isActive: true }) },
  });
  if (!academicYear) throw invalidContext("An active academic year is required.");

  const term = await prisma.term.findFirst({
    where: {
      schoolId,
      academicYearId: academicYear.id,
      ...(requestedTermId ? { id: requestedTermId } : { isActive: true }),
    },
  });
  if (!term) throw invalidContext("An active term is required for the academic year.");
  return { academicYearId: academicYear.id, termId: term.id };
};
