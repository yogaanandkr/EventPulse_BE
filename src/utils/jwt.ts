import jwt from "jsonwebtoken";

const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;
if (!accessSecret || !refreshSecret) {
  throw new Error(`JWT secrets are not configured`);
}
export type UserRole = "CUSTOMER" | "ORGANIZER" | "ADMIN";

export interface IAccessTokenPayload {
  userId: string;
  role: UserRole;
}

export interface IRefreshTokenPayload {
  userId: string;
}

export const generateAccessToken = (payload: IAccessTokenPayload) => {
  return jwt.sign(payload, accessSecret, { expiresIn: "15m" });
};

export const generateRefreshToken = (payload: IRefreshTokenPayload) => {
  return jwt.sign(payload, refreshSecret, { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, accessSecret);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, refreshSecret);
};
