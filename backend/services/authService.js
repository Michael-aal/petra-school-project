import { userModel } from "../models/userModel.js";
import { hashPassword } from "../utils/hashPassword.js";
import { comparePassword } from "../utils/comparePassword.js";
import { generateToken } from "../utils/generateToken.js";

const getNameParts = (fullName = "") => {
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.length > 1 ? parts[parts.length - 1] : "",
  };
};

const safeUser = (user) => {
  const { firstName, lastName } = getNameParts(user.fullName || "");

  return {
    id: user.id,
    fullName: user.fullName || "",
    firstName: user.firstName || firstName,
    lastName: user.lastName || lastName,
    email: user.email,
    role: user.role,
    phone: user.phone || "",
    institution: user.institution || "",
    institutionType: user.institutionType || "",
    state: user.state || "",
    city: user.city || "",
    hearAbout: user.hearAbout || "",
    profilePicture: user.profilePicture || "",
    profileImage: user.profileImage || user.profilePicture || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const authService = {
  register: async ({ fullName, email, password, phone, institution, institutionType, state, city, hearAbout, ...rest }) => {
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      const error = new Error("Email already in use");
      error.statusCode = 409;
      throw error;
    }

    const hashed = await hashPassword(password);
    const user = await userModel.create({
      fullName,
      email,
      password: hashed,
      phone,
      institution,
      institutionType,
      state,
      city,
      hearAbout,
      ...rest,
    });

    return {
      user: safeUser(user),
      token: generateToken({ id: user.id, email: user.email, role: user.role }),
    };
  },

  login: async ({ email, password }) => {
    const user = await userModel.findByEmail(email);
    if (!user) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    return {
      user: safeUser(user),
      token: generateToken({ id: user.id, email: user.email, role: user.role }),
    };
  },

  profile: async (userId) => {
    const user = await userModel.findById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    return safeUser(user);
  },
};
