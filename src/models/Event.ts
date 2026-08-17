import mongoose, { Schema, type Types } from "mongoose";

export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED";

export interface IEvent extends Document {
  organaizerId: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  category: string;
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
  };

  startDate: Date;
  endDate: Date;
  images: string[];
  status: EventStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    organaizerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    venue: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        trim: true,
      },
    },
    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    images: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "CANCELLED"],
      default: "DRAFT",
    },

    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

eventSchema.index({ organizerId: 1 });
eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ category: 1, startDate: 1 });
eventSchema.index({ "venue.city": 1, startDate: 1 });

export const Event = mongoose.model<IEvent>("Event", eventSchema);
