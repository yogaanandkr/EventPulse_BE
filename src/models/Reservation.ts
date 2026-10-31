import mongoose, { Document, Schema, Types } from "mongoose";

export type ReservationStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED";

export interface IReservationItem {
  ticketTypeId: Types.ObjectId;
  ticketName: string;
  quantity: number;
  unitPrice: number;
}

export interface IReservation extends Document {
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  items: IReservationItem[];
  status: ReservationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reservationItemSchema = new Schema<IReservationItem>(
  {
    ticketTypeId: {
      type: Schema.Types.ObjectId,
      ref: "TicketType",
      required: true,
    },
    ticketName: {
      type: String,
      required: true,
      trim: true,
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
  },
  { _id: false },
);

const reservationSchema = new Schema<IReservation>(
  {
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
    items: {
      type: [reservationItemSchema],
      required: true,
      validate: {
        validator: (items: IReservationItem[]) => items.length > 0,
        message: "A reservation must contain at least one ticket.",
      },
    },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "EXPIRED", "CANCELLED"],
      default: "ACTIVE",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

reservationSchema.index({ userId: 1, status: 1 });
reservationSchema.index({ status: 1, expiresAt: 1 });

const Reservation =
  (mongoose.models.Reservation as mongoose.Model<IReservation>|undefined) ||
  mongoose.model<IReservation>("Reservation", reservationSchema);

export default Reservation;
