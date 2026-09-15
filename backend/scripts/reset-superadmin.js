import "../config/loadEnv.js";
import { prisma, connectDB, disconnectDB } from "../config/db.js";
import { hashPassword } from "../utils/hashPassword.js";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const getRequiredEnv = (name) => {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`${name} is missing. Add it to backend/.env before running this command.`);
  }
  return String(value).trim();
};

async function main() {
  const email = normalizeEmail(getRequiredEnv("SUPERADMIN_EMAIL"));
  const password = getRequiredEnv("SUPERADMIN_PASSWORD");

  if (password.length < 8) {
    throw new Error("SUPERADMIN_PASSWORD must be at least 8 characters long.");
  }

  try {
    await connectDB();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, accountStatus: true },
    });

    if (!user) {
      throw new Error(`No user exists for ${email}. Run the normal seed first to provision the Super Admin.`);
    }

    const normalizedRole = String(user.role || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    if (normalizedRole !== "superadmin" && normalizedRole !== "super_admin") {
      throw new Error(`Refusing to reset ${email}: the existing account has role "${user.role}" instead of Super Admin.`);
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        accountStatus: "active",
      },
    });

    console.log(`Super Admin password reset successfully for ${user.email}.`);
    console.log("The existing account was updated; no new Super Admin account was created.");
  } finally {
    await disconnectDB().catch((error) => {
      console.error("Database disconnect failed:", error instanceof Error ? error.message : error);
    });
  }
}

main().catch((error) => {
  console.error("Super Admin reset failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
