export const normalizeRole = (role = "") => {
  const normalized = String(role || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (["super_admin", "super-admin", "superadmin", "super admin"].includes(normalized)) {
    return "super_admin";
  }

  if (["admin", "principal", "school_admin", "school-admin", "schooladministrator", "school_administrator", "school administrator"].includes(normalized)) {
    return "principal";
  }

  if (["teacher", "staff", "instructor"].includes(normalized)) {
    return "teacher";
  }

  if (["parent", "guardian"].includes(normalized)) {
    return "parent";
  }

  if (["student", "learner"].includes(normalized)) {
    return "student";
  }

  return "parent";
};

export const hasRoleAccess = (user = {}, allowedRoles = []) => {
  const userRole = normalizeRole(user?.role);
  const normalizedAllowedRoles = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).map((role) => normalizeRole(role));

  if (!normalizedAllowedRoles.length) {
    return true;
  }

  if (userRole === "super_admin") {
    return true;
  }

  if (userRole === "teacher") {
    return normalizedAllowedRoles.includes("teacher") || normalizedAllowedRoles.includes("staff");
  }

  if (userRole === "principal") {
    return normalizedAllowedRoles.includes("principal") || normalizedAllowedRoles.includes("super_admin");
  }

  return normalizedAllowedRoles.includes(userRole);
};
