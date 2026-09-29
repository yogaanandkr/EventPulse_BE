import { Event } from "../../models/Event.js";
import type { ICreateEventInput, IUpdateEventInput } from "./event.types.js";

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

export const createEvent = async (
  organizerId: string,
  input: ICreateEventInput,
) => {
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("Invalid event date");
  }

  if (endDate <= startDate) {
    throw new Error("End date must be after start date");
  }

  let slug = generateSlug(input.title);

  const existingSlug = await Event.findOne({ slug });

  if (existingSlug) {
    slug = `${slug}-${Date.now()}`;
  }

  const event = await Event.create({
    organizerId,
    title: input.title.trim(),
    slug,
    description: input.description.trim(),
    category: input.category.trim(),
    venue: input.venue,
    startDate,
    endDate,
    images: input.images ?? [],
    status: "DRAFT",
  });
  return event;
};

export const getEventById = async (eventId: string) => {
  const event = await Event.findById(eventId);

  if (!event) {
    throw new Error("Event not found");
  }

  return event;
};

export const getEvents = async () => {
  return Event.find({
    status: "PUBLISHED",
  }).sort({
    startDate: 1,
  });
};

export const findOwnedEvent = async (
  eventId: string,
  userId: string,
  role: string,
) => {
  const event = await Event.findById(eventId);

  if (!event) {
    throw new Error("Event not found");
  }

  const isOwner = event.organizerId.toString() === userId;

  const isAdmin = role === "ADMIN";

  if (!isOwner && !isAdmin) {
    throw new Error("You are not authorized to manage this event.");
  }

  return event;
};

export const getMyEvents = async (organizerId: string) => {
  return Event.find({
    organizerId,
  }).sort({
    createdAt: -1,
  });
};

export const updateEvent = async (
  eventId: string,
  userId: string,
  role: string,
  input: IUpdateEventInput,
) => {
  const event = await findOwnedEvent(eventId, userId, role);

  if (event.status == "CANCELLED") {
    throw new Error("Cancelled events cannot be updated");
  }

  if (input.title !== undefined) {
    event.title = input.title.trim();
  }

  if (input.description !== undefined) {
    event.description = input.description.trim();
  }

  if (input.category !== undefined) {
    event.category = input.category.trim();
  }

  if (input.venue !== undefined) {
    event.venue = input.venue;
  }

  if (input.images !== undefined) {
    event.images = input.images;
  }

  if (input.startDate !== undefined) {
    const startDate = new Date(input.startDate);

    if (Number.isNaN(startDate.getTime())) {
      throw new Error("Invalid start date");
    }

    event.startDate = startDate;
  }

  if (input.endDate !== undefined) {
    const endDate = new Date(input.endDate);

    if (Number.isNaN(endDate.getTime())) {
      throw new Error("Invalid end date");
    }

    event.endDate = endDate;
  }

  if (event.endDate <= event.startDate) {
    throw new Error("End date must be after start date");
  }

  await event.save();

  return event;
};

export const publishEvent = async (
  eventId: string,
  userId: string,
  role: string,
) => {
  const event = await findOwnedEvent(eventId, userId, role);

  if (event.status !== "DRAFT") {
    throw new Error("Only draft events can be published");
  }

  if (event.startDate <= new Date()) {
    throw new Error("Cannot publish an event that has already started");
  }

  event.status = "PUBLISHED";
  event.publishedAt = new Date();

  await event.save();

  return event;
};

export const cancelEvent = async (
  eventId: string,
  userId: string,
  role: string,
) => {
  const event = await findOwnedEvent(eventId, userId, role);

  if (event.status === "CANCELLED") {
    throw new Error("Event is already cancelled");
  }

  event.status = "CANCELLED";

  await event.save();

  return event;
};
