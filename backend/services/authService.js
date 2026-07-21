import { userModel } from "../models/userModel.js";
import { hashPassword } from "../utils/hashPassword.js";
import { comparePassword } from "../utils/comparePassword.js";
import { generateToken } from "../utils/generateToken.js";

const safeUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const authService = {
  register: async ({ fullName, email, password }) => {
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
