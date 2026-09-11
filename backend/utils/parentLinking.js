export const normalizeParentEmail = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized;
};

export const findStudentsForParentEmail = (students = [], parentEmail = "") => {
  const normalizedParentEmail = normalizeParentEmail(parentEmail);
  if (!normalizedParentEmail) return [];

  return students.filter((student) => normalizeParentEmail(student?.parentEmail) === normalizedParentEmail);
};
