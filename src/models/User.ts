import mongoose, { Schema, type Document } from "mongoose";

export type UserRole = "CUSTOMER" | "ORGANIZER" | "ADMIN";

export interface Iuser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
}

const userSchema = new Schema<Iuser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["CUSTOMER", "ORGANIZER", "ADMIN"],
      default: "CUSTOMER",
    },
    avatar: {
      type: String,
    },
    phone: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model<Iuser>("User", userSchema);
