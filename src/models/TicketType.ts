import mongoose, { Document, Schema, Types } from "mongoose";

export type TicketStatus = "ACTIVE" | "INACTIVE";

export interface ITicketType extends Document {
  eventId: Types.ObjectId;

  name: string;
  description?: string;

  price: number;
  currency: string;

  totalQuantity: number;
  availableQuantity: number;
  soldQuantity: number;
  reservedQuantity: number;

  saleStartDate?: Date;
  saleEndDate?: Date;

  status: TicketStatus;

  createdAt: Date;
  updatedAt: Date;
}

const ticketTypeSchema = new Schema<ITicketType>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },

    totalQuantity: {
      type: Number,
      required: true,
      min: 1,
    },

    availableQuantity: {
      type: Number,
      required: true,
      min: 0,
    },

    soldQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    saleStartDate: {
      type: Date,
    },

    saleEndDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  },
);

ticketTypeSchema.index({ eventId: 1 });

export const TicketType = mongoose.model<ITicketType>(
  "TicketType",
  ticketTypeSchema,
);
