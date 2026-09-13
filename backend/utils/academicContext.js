import { prisma } from "../config/db.js";

const invalidContext = (message) => Object.assign(new Error(message), { statusCode: 400 });

const normalizeTermName = (value) => {
  const name = String(value || "").trim();
  if (!name) return "";
  return /\bterm$/i.test(name) ? name : `${name} Term`;
};

export const resolveAcademicContext = async (schoolId, query = {}) => {
  const requestedYearId = query.academicYearId ? String(query.academicYearId) : null;
  const requestedTermId = query.termId ? String(query.termId) : null;

  // Explicit year/term filters always win. Otherwise the active Academic Session
  // is the admin-facing source of truth for the current year + term. This keeps
  // Overview, attendance and finance reports aligned with the dates/status the
  // admin edits in SessionsPage.
  const activeSession = !requestedYearId && !requestedTermId
    ? await prisma.academicSession.findFirst({
        where: { schoolId, isActive: true },
        orderBy: { startsAt: "desc" },
      })
    : null;

  let academicYear = await prisma.academicYear.findFirst({
    where: {
      schoolId,
      ...(requestedYearId
        ? { id: requestedYearId }
        : activeSession?.name
          ? { name: activeSession.name }
          : { isActive: true }),
    },
  });

  // Keep existing installations safe when a legacy session name does not yet
  // match an AcademicYear record.
  if (!academicYear && !requestedYearId && !requestedTermId) {
    academicYear = await prisma.academicYear.findFirst({
      where: { schoolId, isActive: true },
    });
  }

  if (!academicYear) throw invalidContext("An active academic year is required.");

  const requestedSessionTerm = activeSession ? normalizeTermName(activeSession.term) : null;

  let term = await prisma.term.findFirst({
    where: {
      schoolId,
      academicYearId: academicYear.id,
      ...(requestedTermId
        ? { id: requestedTermId }
        : requestedSessionTerm
          ? { name: requestedSessionTerm }
          : { isActive: true }),
    },
  });

  // If an active session exists but its matching Term has not been created yet,
  // fall back to the active term rather than breaking existing reports.
  if (!term && !requestedTermId && requestedSessionTerm) {
    term = await prisma.term.findFirst({
      where: { schoolId, academicYearId: academicYear.id, isActive: true },
    });
  }

  if (!term) throw invalidContext("An active term is required for the academic year.");
  return { academicYearId: academicYear.id, termId: term.id };
};
