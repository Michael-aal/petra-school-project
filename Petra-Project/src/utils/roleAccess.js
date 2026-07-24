const ROLE_OPTIONS = ["principal", "staff", "parent"];

export function normalizeRole(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "admin" || normalized === "principal") return "principal";
  if (normalized === "teacher" || normalized === "staff") return "staff";
  if (normalized === "parent" || normalized === "student") return "parent";
  return "parent";
}

export function getDashboardPathForRole(role = "") {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "teacher" || normalizedRole === "staff") {
    return "/staff/dashboard";
  }
  if (normalizedRole === "principal" || normalizedRole === "admin") {
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
