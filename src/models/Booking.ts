import mongoose, { Schema, Types } from "mongoose";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED";

export type PaymentStatus = "UNPAID" | "PAID" | "FAILED" | "REFUNDED";

export interface IBookingItem {
  ticketTypeId: Types.ObjectId;
  ticketName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IBooking {
  bookingNumber: string;
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  reservationId: Types.ObjectId;
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
  { _id: false },
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
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    reservationId: {
      type: Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
      unique: true,
    },
    items: {
      type: [bookingItemSchema],
      required: true,
      validate: {
        validator: (items: IBookingItem[]) => items.length > 0,
        message: "A booking must contain at least one ticket.",
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
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED", "EXPIRED"],
      default: "PENDING",
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID", "FAILED", "REFUNDED"],
      default: "UNPAID",
      required: true,
    },
    bookedAt: Date,
    confirmedAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true },
);

bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ eventId: 1, status: 1 });

const Booking =
  (mongoose.models.Booking as mongoose.Model<IBooking> | undefined) ??
  mongoose.model<IBooking>("Booking", bookingSchema);

export default Booking;