const accessSecret = process.env.JWT_ACCESS_SECRET;
import jwt from 'jsonwebtoken'
if (!accessSecret) {
  throw new Error(`JWT_ACCESS_SECRET is not configured`);
}
export interface AuthPayload {
  userId: string;
  role: "CUSTOMER" | "ORGANIZER" | "ADMIN";
}

export const verifyAccessToken = (token: string): AuthPayload => {
    return jwt.verify(token, accessSecret) as AuthPayload
}