export function splitFullName(fullName = "") {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return { firstName: "", lastName: "", fullName: "" };
  }

  const parts = trimmed.split(" ");
  const firstName = parts[0] || "";
  const lastName = parts.length > 1 ? parts[parts.length - 1] : "";

  return { firstName, lastName, fullName: trimmed };
}

export function getFirstName(user = {}) {
  const firstName = user.firstName?.trim();
  if (firstName) return firstName;

  const fullName = user.fullName?.trim();
  if (fullName) {
    return fullName.split(/\s+/)[0];
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return "";
}

export function getDisplayName(user = {}) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.fullName || getUsername(user) || getFirstName(user) || "";
}

export function getUsername(user = {}) {
  if (user.username) return user.username;
  if (user.email) return user.email.split("@")[0];
  return "";
}

export function getUserInitials(user = {}) {
  const firstName = user.firstName?.trim();
  const lastName = user.lastName?.trim();

  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  if (firstName) return firstName[0].toUpperCase();

  const fullName = user.fullName?.trim() || "";
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  if (parts.length) return parts[0][0].toUpperCase();
  if (user.email) return user.email[0].toUpperCase();

  return "U";
}

export function normalizeUser(user = {}) {
  const parsedName = splitFullName(user.fullName || `${user.firstName || ""} ${user.lastName || ""}`);
  const firstName = user.firstName || parsedName.firstName;
  const lastName = user.lastName || parsedName.lastName;
  const fullName = user.fullName || [firstName, lastName].filter(Boolean).join(" ").trim();

  return {
    id: user.id || "",
    firstName,
    lastName,
    fullName: fullName || getUsername(user) || "",
    email: user.email || "",
    username: getUsername(user),
    role: user.role || "user",
    profileImage: user.profileImage || user.profilePicture || "",
    phoneNumber: user.phoneNumber || user.phone || "",
    institution: user.institution || "",
    state: user.state || "",
    city: user.city || "",
    referral: user.referral || "",
    schoolCode: user.schoolCode || "",
    address: user.address || "",
    country: user.country || "",
    totalStudent: user.totalStudent || 0,
  };
}