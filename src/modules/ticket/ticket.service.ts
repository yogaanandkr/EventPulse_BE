import { Event } from "../../models/Event.js";
import { TicketType } from "../../models/TicketType.js";
import type {
  ICreateTicketTypeInput,
  IUpdateTicketTypeInput,
} from "./ticket.types.js";

export const getOwnedEvent = async (
  eventId: string,
  userId: string,
  role: string,
) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new Error("Event not found");
  }
  console.log(event.organizerId, userId);
  const isOwner = event.organizerId.toString() == userId;

  const isAdmin = role === "ADMIN";
  console.log("isadmin/owner: ", isAdmin, isOwner);
  if (!isOwner && !isAdmin) {
    throw new Error("You are not authorized to manage tickets for this event");
  }

  return event;
};

export const createTicketType = async (
  userId: string,
  role: string,
  input: ICreateTicketTypeInput,
) => {
  const event = await getOwnedEvent(input.eventId, userId, role);

  if (event.status == "CANCELLED") {
    throw new Error("Cannot create tickets for cancelled event");
  }

  if (input.price < 0) {
    throw new Error("Ticket price cannot be negative");
  }

  if (input.totalQuantity && input.totalQuantity <= 0) {
    throw new Error("Ticket quantity must be greater than zero");
  }

  let saleStartDate: Date | undefined;
  let saleEndDate: Date | undefined;

  if (input.saleStartDate) {
    saleStartDate = new Date(input.saleStartDate);

    if (Number.isNaN(saleStartDate.getTime())) {
      throw new Error("Invalid ticket sale start date");
    }
  }

  if (input.saleEndDate) {
    saleEndDate = new Date(input.saleEndDate);

    if (Number.isNaN(saleEndDate.getTime())) {
      throw new Error("Invalid ticket sale end date");
    }
  }

  if (saleStartDate && saleEndDate && saleEndDate <= saleStartDate) {
    throw new Error("Ticket sale end date must be after start date");
  }

  if (saleEndDate && saleEndDate > event.startDate) {
    throw new Error("Ticket sales cannot end after the event starts");
  }

  const createTicketType = await TicketType.create({
    eventId: input.eventId,
    name: input.name.trim(),

    ...(input.description !== undefined && {
      description: input.description.trim(),
    }),

    price: input.price,
    currency: input.currency ?? "INR",

    totalQuantity: input.totalQuantity,
    availableQuantity: input.totalQuantity,

    soldQuantity: 0,
    reservedQuantity: 0,

    ...(saleStartDate !== undefined && {
      saleStartDate,
    }),

    ...(saleEndDate !== undefined && {
      saleEndDate,
    }),

    status: "ACTIVE",
  });

  return createTicketType;
};

export const getTicketTypes = async (eventId: string) => {
  return TicketType.find({
    eventId,
    status: "ACTIVE",
  }).sort({
    price: 1,
  });
};

export const updateTicketType = async (
  ticketTypeId: string,
  userId: string,
  role: string,
  input: IUpdateTicketTypeInput,
) => {
  const ticketType = await TicketType.findById(ticketTypeId);

  if (!ticketType) {
    throw new Error("Ticket type not found");
  }

  await getOwnedEvent(ticketType.eventId.toString(), userId, role);

  if (input.price !== undefined) {
    if (input.price < 0) {
      throw new Error("Ticket price cannot be negative");
    }

    ticketType.price = input.price;
  }

  if (input.name !== undefined) {
    ticketType.name = input.name.trim();
  }

  if (input.description !== undefined) {
    ticketType.description = input.description.trim();
  }

  if (input.status !== undefined) {
    ticketType.status = input.status;
  }

  if (input.saleStartDate !== undefined) {
    const date = new Date(input.saleStartDate);

    if (Number.isNaN(date.getTime())) {
      throw new Error("Invalid ticket sale start date");
    }

    ticketType.saleStartDate = date;
  }

  if (input.saleEndDate !== undefined) {
    const date = new Date(input.saleEndDate);

    if (Number.isNaN(date.getTime())) {
      throw new Error("Invalid ticket sale end date");
    }

    ticketType.saleEndDate = date;
  }

  if (
    ticketType.saleStartDate &&
    ticketType.saleEndDate &&
    ticketType.saleEndDate <= ticketType.saleStartDate
  ) {
    throw new Error("Ticket sale end date must be after start date");
  }

  await ticketType.save();

  return ticketType;
};
