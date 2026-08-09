const ROLE_OPTIONS = ["student", "teacher", "parent", "principal"];

export function normalizeRole(value = "") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (["admin", "principal", "school_admin", "school-admin", "schooladministrator", "school administrator"].includes(normalized)) {
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

  if (["super_admin", "super-admin", "superadmin", "super admin"].includes(normalized)) {
    return "super_admin";
  }

  return "parent";
}

export function getDashboardPathForRole(role = "") {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "teacher") {
    return "/staff/dashboard";
  }
  if (normalizedRole === "super_admin") {
    return "/dev";
  }
  if (normalizedRole === "principal") {
    return "/dashboard";
  }
  if (normalizedRole === "parent" || normalizedRole === "student") {
    return "/portal/dashboard";
  }
  return `/${normalizedRole}/dashboard`;
}

export function getRoleLabel(role = "") {
  const normalizedRole = normalizeRole(role);
  return normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1);
}

export { ROLE_OPTIONS };
