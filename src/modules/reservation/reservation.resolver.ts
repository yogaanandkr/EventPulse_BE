import { GraphQLError } from "graphql";

import {
  createReservation,
  releaseReservation,
} from "./reservation.service.js";
import Booking from "../../models/Booking.js";

interface AuthenticatedUser {
  userId: string;
  role: string;
}

export interface GraphQLContext {
  user: {
    userId: string;
    role: string;
  } | null;
}

function requireCustomer(context: GraphQLContext): string {
  if (!context.user) {
    throw new GraphQLError("You must be logged in.", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  if (context.user.role !== "CUSTOMER") {
    throw new GraphQLError(
      "Only customers can create or release reservations.",
      {
        extensions: { code: "FORBIDDEN" },
      },
    );
  }

  return context.user.userId;
}

function formatReservation(reservation: any) {
  const data =
    typeof reservation.toObject === "function"
      ? reservation.toObject()
      : reservation;

  return {
    ...data,
    id: data._id.toString(),
    userId: data.userId.toString(),
    eventId: data.eventId.toString(),
    expiresAt: new Date(data.expiresAt).toISOString(),
    createdAt: new Date(data.createdAt).toISOString(),
    updatedAt: new Date(data.updatedAt).toISOString(),
    items: data.items.map((item: any) => ({
      ...item,
      ticketTypeId: item.ticketTypeId.toString(),
    })),
  };
}

function formatBooking(booking: any) {
  const data =
    typeof booking.toObject === "function" ? booking.toObject() : booking;

  return {
    ...data,
    id: data._id.toString(),
    userId: data.userId.toString(),
    eventId: data.eventId.toString(),
    reservationId: data.reservationId.toString(),
    bookedAt: data.bookedAt?.toISOString() ?? null,
    confirmedAt: data.confirmedAt?.toISOString() ?? null,
    cancelledAt: data.cancelledAt?.toISOString() ?? null,
    createdAt: new Date(data.createdAt).toISOString(),
    updatedAt: new Date(data.updatedAt).toISOString(),
    items: data.items.map((item: any) => ({
      ...item,
      ticketTypeId: item.ticketTypeId.toString(),
    })),
  };
}

const reservationResolvers = {
  Query: {
    myBookings: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      const userId = requireCustomer(context);

      const bookings = await Booking.find({ userId })
        .sort({ createdAt: -1 })
        .lean();

      return bookings.map(booking => formatBooking(booking));
    },
  },

  Mutation: {
    createReservation: async (
      _parent: unknown,
      args: {
        input: {
          eventId: string;
          items: {
            ticketTypeId: string;
            quantity: number;
          }[];
        };
      },
      context: GraphQLContext,
    ) => {
      const userId = requireCustomer(context);

      const result = await createReservation(userId, args.input);

      return {
        reservation: formatReservation(result.reservation),
        booking: formatBooking(result.booking),
      };
    },

    releaseReservation: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      const userId = requireCustomer(context);

      return releaseReservation(userId, args.id);
    },
  },
};

export default reservationResolvers;
