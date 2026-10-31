import mongoose from "mongoose";

import Reservation from "../../models/Reservation.js";
import Booking from "../../models/Booking.js";
import { TicketType } from "../../models/TicketType.js";

export async function expireReservationIfDue(
  reservationId: string,
): Promise<boolean> {
  const session = await mongoose.startSession();

  let expired = false;

  try {
    await session.withTransaction(async () => {
      const now = new Date();

      // Only active reservations whose hold has actually expired.
      const reservation = await Reservation.findOne({
        _id: reservationId,
        status: "ACTIVE",
        expiresAt: { $lte: now },
      }).session(session);

      if (!reservation) {
        // Another worker may already have handled it.
        return;
      }

      const booking = await Booking.findOne({
        reservationId: reservation._id,
      }).session(session);

      if (!booking) {
        throw new Error(`Booking missing for reservation ${reservationId}`);
      }

      // Never release inventory belonging to a paid or completed booking.
      if (booking.status !== "PENDING" || booking.paymentStatus !== "UNPAID") {
        return;
      }

      // Claim the expiration within the transaction.
      // The status guard prevents duplicate releases.
      const claimedReservation = await Reservation.findOneAndUpdate(
        {
          _id: reservation._id,
          status: "ACTIVE",
          expiresAt: { $lte: now },
        },
        {
          $set: { status: "EXPIRED" },
        },
        {
          new: true,
          session,
        },
      );

      if (!claimedReservation) {
        return;
      }

      for (const item of claimedReservation.items) {
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
            `Inventory inconsistency for ticket type ${item.ticketTypeId}`,
          );
        }
      }

      booking.status = "EXPIRED";
      await booking.save({ session });

      expired = true;
    });

    return expired;
  } finally {
    await session.endSession();
  }
}
