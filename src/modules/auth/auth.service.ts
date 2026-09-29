import bcrypt from "bcryptjs";
import { User } from "../../models/User.js";
import type { ILogin, IRegister } from "./auth.types.js";
import { error } from "node:console";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";

export const registerUser = async (input: IRegister) => {
  const { name, email, password, role = "CUSTOMER" } = input;

  const normalizeEmail = email.toLowerCase().trim();

  // check if user exists

  let existingUser = await User.findOne({ email: normalizeEmail });

  if (existingUser) {
    throw new Error("user with this email already exists");
  }
  const hashPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email: normalizeEmail,
    passwordHash: hashPassword,
    role,
  });

  return user;
};

export const loginUser = async (input: ILogin) => {
  const { email, password } = input;

  const normalizeEmail = email.toLowerCase().trim();

  let user = await User.findOne({ email: normalizeEmail });

  if (!user) {
    throw new Error("Invalid email or password.");
  }
  if (!user.isActive) {
    throw new Error("User account is inactive");
  }

  // check password valid
  const checkPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!checkPasswordValid) {
    throw new Error("password is invalid");
  }

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    role: user.role,
  });
  const refreshToken = generateRefreshToken({
    userId: user._id.toString(),
  });
  return {
    accessToken,
    refreshToken,
    user,
  };
};

export const refreshUserToken = async (refreshToken: string) => {
  const payload: any = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.userId);
  if (!user) {
    throw new Error("user not found");
  }

  if (!user.isActive) {
    throw new Error("User account is inactive");
  }

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    role: user.role,
  });

  return {
    accessToken,
    user,
  };
};
