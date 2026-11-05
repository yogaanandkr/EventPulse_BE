import { GraphQLError } from "graphql";

import Booking from "../../models/Booking.js";
import Reservation from "../../models/Reservation.js";
import Payment from "../../models/Payment.js";
import razorpay from "../../config/razorpay.js";

import crypto from "node:crypto";
import mongoose from "mongoose";
import { TicketType } from "../../models/TicketType.js";

interface VerifyRazorpayPaymentInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

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

export async function createPaymentOrder(userId: string, bookingId: string) {
  const booking = await Booking.findOne({
    _id: bookingId,
    userId,
  });

  if (!booking) {
    notFound("Booking not found.");
  }

  if (booking.status !== "PENDING" || booking.paymentStatus !== "UNPAID") {
    conflict("This booking is not available for payment.");
  }

  const reservation = await Reservation.findOne({
    _id: booking.reservationId,
    userId,
    status: "ACTIVE",
  });

  if (!reservation || reservation.expiresAt <= new Date()) {
    conflict("Your reservation has expired. Please reserve tickets again.");
  }

  // Razorpay expects amounts in the smallest currency unit.
  const amountInPaise = Math.round(booking.totalAmount * 100);

  if (!Number.isSafeInteger(amountInPaise) || amountInPaise <= 0) {
    badRequest("Invalid booking amount.");
  }

  // Reuse an existing pending order where possible.
  // The unique order/booking constraints in the database should
  // also be designed to handle concurrent requests.
  const existingPayment = await Payment.findOne({
    bookingId: booking._id,
    userId,
    provider: "RAZORPAY",
    status: "PENDING",
    providerOrderId: { $exists: true, $ne: null },
  });

  if (existingPayment?.providerOrderId) {
    return {
      paymentId: existingPayment._id.toString(),
      orderId: existingPayment.providerOrderId,
      amount: amountInPaise,
      currency: booking.currency,
      keyId: process.env.RAZORPAY_KEY_ID!,
      bookingNumber: booking.bookingNumber,
    };
  }

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: booking.currency,
    receipt: booking.bookingNumber,
    notes: {
      bookingId: booking._id.toString(),
      userId,
    },
  });

  const payment = await Payment.create({
    bookingId: booking._id,
    userId,
    provider: "RAZORPAY",
    providerOrderId: order.id,
    amount: booking.totalAmount,
    currency: booking.currency,
    status: "PENDING",
  });

  return {
    paymentId: payment._id.toString(),
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID!,
    bookingNumber: booking.bookingNumber,
  };
}

function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    throw new Error("RAZORPAY_KEY_SECRET is not configured.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  // Avoid comparing buffers of different lengths.
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const actualBuffer = Buffer.from(signature, "hex");

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !/^[a-fA-F0-9]{64}$/.test(signature)
  ) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export async function verifyRazorpayPayment(
  userId: string,
  input: VerifyRazorpayPaymentInput,
) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = input;

  // 1. Find the order saved by our backend.
  const paymentRecord = await Payment.findOne({
    providerOrderId: razorpay_order_id,
    userId,
    provider: "RAZORPAY",
  });

  if (!paymentRecord) {
    throw new GraphQLError("Payment order not found.", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  // 2. Verify the signature using the stored order ID.
  const isValid = verifyPaymentSignature(
    paymentRecord.providerOrderId!,
    razorpay_payment_id,
    razorpay_signature,
  );

  if (!isValid) {
    throw new GraphQLError("Invalid payment signature.", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  // 3. Ask Razorpay for the actual payment status.
  const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

  // 4. Ensure this payment belongs to our order.
  if (razorpayPayment.order_id !== paymentRecord.providerOrderId) {
    throw new GraphQLError("Payment does not belong to this order.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  // 5. Verify the amount and currency against our database.
  const expectedAmountInPaise = Math.round(paymentRecord.amount * 100);

  if (
    razorpayPayment.amount !== expectedAmountInPaise ||
    razorpayPayment.currency !== paymentRecord.currency
  ) {
    throw new GraphQLError("Payment amount or currency mismatch.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  // 6. Do not confirm an order for an uncaptured payment.
  if (razorpayPayment.status !== "captured") {
    throw new GraphQLError(
      `Payment is not captured. Current status: ${razorpayPayment.status}`,
      { extensions: { code: "PAYMENT_NOT_CAPTURED" } },
    );
  }

  // 7. Confirm the booking and update inventory atomically.
  const session = await mongoose.startSession();

  let confirmedBooking: any = null;

  try {
    await session.withTransaction(async () => {
      const currentPayment = await Payment.findById(paymentRecord._id).session(
        session,
      );

      if (!currentPayment) {
        throw new Error("Payment record no longer exists.");
      }

      // Idempotency: a repeated request must not sell tickets twice.
      if (currentPayment.status === "PAID") {
        confirmedBooking = await Booking.findById(
          currentPayment.bookingId,
        ).session(session);

        if (!confirmedBooking) {
          throw new Error("Confirmed booking could not be found.");
        }

        return;
      }

      const booking = await Booking.findById(currentPayment.bookingId).session(
        session,
      );

      if (!booking) {
        throw new Error("Booking not found.");
      }

      const reservation = await Reservation.findOne({
        _id: booking.reservationId,
        userId,
      }).session(session);

      // Never fulfil a booking whose inventory hold has expired.
      if (
        booking.status !== "PENDING" ||
        booking.paymentStatus !== "UNPAID" ||
        !reservation ||
        reservation.status !== "ACTIVE" ||
        reservation.expiresAt <= new Date()
      ) {
        throw new GraphQLError(
          "Reservation is no longer valid. Payment reconciliation is required.",
          { extensions: { code: "RESERVATION_EXPIRED" } },
        );
      }

      // Convert reserved tickets into sold tickets.
      for (const item of reservation.items) {
        const ticket = await TicketType.findOneAndUpdate(
          {
            _id: item.ticketTypeId,
            reservedQuantity: { $gte: item.quantity },
          },
          {
            $inc: {
              reservedQuantity: -item.quantity,
              soldQuantity: item.quantity,
            },
          },
          {
            new: true,
            session,
          },
        );

        if (!ticket) {
          throw new Error(
            `Unable to confirm inventory for ticket ${item.ticketTypeId}.`,
          );
        }
      }

      reservation.status = "COMPLETED";
      await reservation.save({ session });

      booking.status = "CONFIRMED";
      booking.paymentStatus = "PAID";
      booking.confirmedAt = new Date();
      booking.bookedAt = new Date();

      await booking.save({ session });

      currentPayment.status = "PAID";
      currentPayment.providerPaymentId = razorpay_payment_id;
      currentPayment.method = razorpayPayment.method;
      currentPayment.paidAt = new Date();

      await currentPayment.save({ session });

      confirmedBooking = booking;
    });
  } finally {
    await session.endSession();
  }

  return confirmedBooking;
}
