import mongoose, { Document, Schema, Types } from "mongoose";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

interface IBookingItem {
  ticketTypeId: Types.ObjectId;
  ticketName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IBooking extends Document {
  bookingNumber: string;

  userId: Types.ObjectId;
  eventId: Types.ObjectId;

  items: IBookingItem[];

  subtotal: number;
  discount: number;
  totalAmount: number;
  currency: string;

  status: BookingStatus;
  paymentStatus: PaymentStatus;

  bookedAt?: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const bookingItemSchema = new Schema<IBookingItem>(
  {
    ticketTypeId: {
      type: Schema.Types.ObjectId,
      ref: "TicketType",
      required: true,
    },

    ticketName: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const bookingSchema = new Schema<IBooking>(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    items: {
      type: [bookingItemSchema],
      required: true,
      validate: {
        validator: (items: IBookingItem[]) => items.length > 0,
        message: "Booking must contain at least one ticket",
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
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
      enum: ["PENDING", "CONFIRMED", "CANCELLED", "EXPIRED"],
      default: "PENDING",
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "PENDING",
    },

    bookedAt: {
      type: Date,
    },

    confirmedAt: {
      type: Date,
    },

    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ eventId: 1, status: 1 });

export const Booking = mongoose.model<IBooking>("Booking", bookingSchema);
