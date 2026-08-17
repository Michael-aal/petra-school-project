import bcrypt from "bcrypt";

export const comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) return false;

  return bcrypt.compare(password, hashedPassword);
};
