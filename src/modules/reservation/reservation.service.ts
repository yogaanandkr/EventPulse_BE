import mongoose, { Types } from "mongoose";
import { randomBytes } from "node:crypto";
import { GraphQLError } from "graphql";

import Reservation from "../../models/Reservation.js";
import Booking from "../../models/Booking.js";
import { TicketType } from "../../models/TicketType.js";
import { Event } from "../../models/Event.js";

interface CreateReservationItemInput {
  ticketTypeId: string;
  quantity: number;
}

interface CreateReservationInput {
  eventId: string;
  items: CreateReservationItemInput[];
}

const RESERVATION_DURATION_MS = 10 * 60 * 1000;

function badRequest(message: string): never {
  throw new GraphQLError(message, {
    extensions: { code: "BAD_USER_INPUT" },
  });
}

function notFound(message: string): never {
  throw new GraphQLError(message, {
    extensions: { code: "NOT_FOUND" },
  });
}

function conflict(message: string): never {
  throw new GraphQLError(message, {
    extensions: { code: "CONFLICT" },
  });
}

export async function createReservation(
  userId: string,
  input: CreateReservationInput,
) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new GraphQLError("Invalid authenticated user.");
  }

  if (!Types.ObjectId.isValid(input.eventId)) {
    badRequest("Invalid event ID.");
  }

  if (!input.items?.length) {
    badRequest("Select at least one ticket.");
  }

  // Validate the entire request before starting the transaction.
  const ticketTypeIds = new Set<string>();

  for (const item of input.items) {
    if (!Types.ObjectId.isValid(item.ticketTypeId)) {
      badRequest("Invalid ticket type ID.");
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      badRequest("Ticket quantities must be positive integers.");
    }

    if (ticketTypeIds.has(item.ticketTypeId)) {
      badRequest("Each ticket type must appear only once in a reservation.");
    }

    ticketTypeIds.add(item.ticketTypeId);
  }

  const session = await mongoose.startSession();

  let result:
    | {
        reservation: InstanceType<typeof Reservation>;
        booking: InstanceType<typeof Booking>;
      }
    | undefined;

  try {
    await session.withTransaction(async () => {
      const now = new Date();

      const event = await Event.findOne({
        _id: input.eventId,
        status: "PUBLISHED",
        startDate: { $gt: now },
      }).session(session);

      if (!event) {
        notFound("Event not found or ticket sales are unavailable.");
      }

      const reservationItems = [];
      let subtotal = 0;
      let currency: string | undefined;

      // Sort IDs to make inventory updates consistent across requests.
      const items = [...input.items].sort((a, b) =>
        a.ticketTypeId.localeCompare(b.ticketTypeId),
      );

      for (const item of items) {
        const ticket = await TicketType.findOne({
          _id: item.ticketTypeId,
          eventId: input.eventId,
          status: "ACTIVE",
        }).session(session);

        if (!ticket) {
          notFound(`Ticket type ${item.ticketTypeId} is unavailable.`);
        }

        if (ticket.saleStartDate && now < ticket.saleStartDate) {
          conflict(`Sales have not started for "${ticket.name}".`);
        }

        if (ticket.saleEndDate && now > ticket.saleEndDate) {
          conflict(`Sales have ended for "${ticket.name}".`);
        }

        if (currency && currency !== ticket.currency) {
          badRequest(
            "All tickets in a reservation must use the same currency.",
          );
        }

        currency = ticket.currency;

        // Atomically claim inventory only if enough tickets remain.
        const updatedTicket = await TicketType.findOneAndUpdate(
          {
            _id: ticket._id,
            eventId: input.eventId,
            status: "ACTIVE",
            availableQuantity: { $gte: item.quantity },
          },
          {
            $inc: {
              availableQuantity: -item.quantity,
              reservedQuantity: item.quantity,
            },
          },
          {
            new: true,
            session,
          },
        );

        if (!updatedTicket) {
          conflict(`Not enough tickets available for "${ticket.name}".`);
        }

        const lineTotal = ticket.price * item.quantity;
        subtotal += lineTotal;

        reservationItems.push({
          ticketTypeId: ticket._id,
          ticketName: ticket.name,
          quantity: item.quantity,
          unitPrice: ticket.price,
        });
      }

      const expiresAt = new Date(now.getTime() + RESERVATION_DURATION_MS);

      const [reservation] = await Reservation.create(
        [
          {
            userId: new Types.ObjectId(userId),
            eventId: event._id,
            items: reservationItems,
            status: "ACTIVE",
            expiresAt,
          },
        ],
        { session },
      );
      if (!reservation) {
        throw new Error("Failed to create reservation.");
      }
      const bookingNumber = `EP-${Date.now()}-${randomBytes(4).toString("hex").toUpperCase()}`;

      const bookingItems = reservationItems.map(item => ({
        ...item,
        totalPrice: item.unitPrice * item.quantity,
      }));

      const [booking] = await Booking.create(
        [
          {
            bookingNumber,
            userId: new Types.ObjectId(userId),
            eventId: event._id,
            reservationId: reservation._id,
            items: bookingItems,
            subtotal,
            discount: 0,
            totalAmount: subtotal,
            currency: currency ?? "INR",
            status: "PENDING",
            paymentStatus: "UNPAID",
          },
        ],
        { session },
      );
      if (!booking) {
        throw new Error("Failed to create booking.");
      }
      result = { reservation, booking };
    });

    if (!result) {
      throw new Error("Reservation transaction did not complete.");
    }

    return result;
  } finally {
    await session.endSession();
  }
}

export async function releaseReservation(
  userId: string,
  reservationId: string,
) {
  if (
    !Types.ObjectId.isValid(userId) ||
    !Types.ObjectId.isValid(reservationId)
  ) {
    badRequest("Invalid user or reservation ID.");
  }

  const session = await mongoose.startSession();

  let finalStatus: "CANCELLED" | "EXPIRED" | undefined;

  try {
    await session.withTransaction(async () => {
      const reservation = await Reservation.findOne({
        _id: reservationId,
        userId,
        status: "ACTIVE",
      }).session(session);

      if (!reservation) {
        notFound(
          "Active reservation not found. It may already be completed, cancelled, or expired.",
        );
      }

      const now = new Date();

      finalStatus = reservation.expiresAt <= now ? "EXPIRED" : "CANCELLED";

      const booking = await Booking.findOne({
        reservationId: reservation._id,
        userId,
      }).session(session);

      if (!booking) {
        throw new Error(
          "Reservation has no associated booking. Manual investigation is required.",
        );
      }

      // Never release inventory belonging to an already paid booking.
      if (booking.status !== "PENDING" || booking.paymentStatus !== "UNPAID") {
        conflict(
          "This booking can no longer be released through this operation.",
        );
      }

      for (const item of reservation.items) {
        const updatedTicket = await TicketType.findOneAndUpdate(
          {
            _id: item.ticketTypeId,
            reservedQuantity: { $gte: item.quantity },
          },
          {
            $inc: {
              availableQuantity: item.quantity,
              reservedQuantity: -item.quantity,
            },
          },
          {
            new: true,
            session,
          },
        );

        if (!updatedTicket) {
          throw new Error(
            "Inventory inconsistency detected while releasing a reservation.",
          );
        }
      }

      reservation.status = finalStatus;
      await reservation.save({ session });

      booking.status = finalStatus;
      await booking.save({ session });
    });

    if (!finalStatus) {
      throw new Error("Reservation release transaction did not complete.");
    }

    return {
      success: true,
      status: finalStatus,
    };
  } finally {
    await session.endSession();
  }
}
