const normalizeText = (value) => {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
};

const buildName = (entity = {}) => {
  const explicit = normalizeText(entity.fullName || entity.displayName || entity.name);
  if (explicit) return explicit;

  const firstName = normalizeText(entity.firstName);
  const lastName = normalizeText(entity.lastName);
  return [firstName, lastName].filter(Boolean).join(" ").trim();
};

const isLikelyId = (value, fallbackId) => {
  const normalized = normalizeText(value);
  if (!normalized) return false;

  if (fallbackId !== undefined && normalizeText(String(fallbackId)) === normalized) {
    return true;
  }

  if (/^\d+$/.test(normalized)) {
    return true;
  }

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)) {
    return true;
  }

  return false;
};

export function getStudentDisplayName(student = {}) {
  const studentName = buildName(student);
  const userName = buildName(student.user);
  const explicitFullName = normalizeText(student.fullName || student.displayName || student.studentName || userName || studentName);

  if (explicitFullName && !isLikelyId(explicitFullName, student?.id)) {
    return explicitFullName;
  }

  const fallbackName = normalizeText(student.name || student.studentName || student.fullName || student.displayName || userName || studentName);
  if (fallbackName && !isLikelyId(fallbackName, student?.id)) {
    return fallbackName;
  }

  if (userName && !isLikelyId(userName, student?.id)) {
    return userName;
  }

  if (studentName && !isLikelyId(studentName, student?.id)) {
    return studentName;
  }

  if (student?.admissionNumber && !isLikelyId(student.admissionNumber, student?.id)) {
    return normalizeText(student.admissionNumber);
  }

  if (student?.guardianName) {
    return normalizeText(student.guardianName);
  }

  return normalizeText(student?.admissionNumber || "Unnamed learner");
}
