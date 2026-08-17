import mongoose, { Document, Schema, Types } from "mongoose";

export type PaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "REFUND_PENDING"
  | "REFUNDED";

export interface IPayment extends Document {
  bookingId: Types.ObjectId;
  userId: Types.ObjectId;

  provider: string;

  providerOrderId?: string;
  providerPaymentId?: string;

  amount: number;
  currency: string;

  status: PaymentStatus;

  method?: string;

  failureReason?: string;

  paidAt?: Date;
  refundedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    provider: {
      type: String,
      required: true,
    },

    providerOrderId: {
      type: String,
      index: true,
    },

    providerPaymentId: {
      type: String,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUND_PENDING", "REFUNDED"],
      default: "PENDING",
    },

    method: {
      type: String,
    },

    failureReason: {
      type: String,
    },

    paidAt: {
      type: Date,
    },

    refundedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ providerPaymentId: 1 });

export const Payment = mongoose.model<IPayment>("Payment", paymentSchema);
