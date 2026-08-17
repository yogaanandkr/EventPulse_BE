import mongoose, { Document, Schema, Types } from "mongoose";

export type ReservationStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED";

interface IReservationItem {
  ticketTypeId: Types.ObjectId;
  quantity: number;
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

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    _id: false,
  },
);

const reservationSchema = new Schema<IReservation>(
  {
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
      type: [reservationItemSchema],
      required: true,
      validate: {
        validator: (items: IReservationItem[]) => items.length > 0,
        message: "Reservation must contain at least one ticket",
      },
    },

    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "EXPIRED", "CANCELLED"],
      default: "ACTIVE",
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

reservationSchema.index({ userId: 1, status: 1 });
reservationSchema.index({ eventId: 1, status: 1 });

export const Reservation = mongoose.model<IReservation>(
  "Reservation",
  reservationSchema,
);
