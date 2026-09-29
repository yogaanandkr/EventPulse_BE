import type { IGraphQlContext } from "../../graphql/graphql.types.js";
import { requireRole } from "../../utils/requireRoles.js";
import {
  cancelEvent,
  createEvent,
  getEventById,
  getEvents,
  getMyEvents,
  publishEvent,
  updateEvent,
} from "./event.service.js";

export const eventResolvers = {
  Query: {
    event: async (_parent: unknown, args: { id: string }) => {
      return getEventById(args.id);
    },
    events: async () => {
      return getEvents();
    },
    myEvents: async (
      _parent: unknown,
      _args: unknown,
      context: IGraphQlContext,
    ) => {
      const authUser = requireRole(context, ["ORGANIZER", "ADMIN"]);

      return getMyEvents(authUser.userId);
    },
  },

  Mutation: {
    createEvent: async (
      _parent: unknown,
      args: {
        input: {
          title: string;
          description: string;
          category: string;
          venue: {
            name: string;
            address: string;
            city: string;
            state: string;
            country: string;
          };
          startDate: string;
          endDate: string;
          images?: string[];
        };
      },
      context: IGraphQlContext,
    ) => {
      const authUser = requireRole(context, ["ORGANIZER", "ADMIN"]);

      return createEvent(authUser.userId, args.input);
    },
    updateEvent: async (
      _parent: unknown,
      args: {
        id: string;
        input: any;
      },
      context: IGraphQlContext,
    ) => {
      const authUser = requireRole(context, ["ORGANIZER", "ADMIN"]);

      const result = updateEvent(
        args.id,
        authUser.userId,
        authUser.role,
        args.input,
      );

      console.log("result: ", result);
      return result;
    },

    publishEvent: async (
      _parent: unknown,
      args: { id: string },
      context: IGraphQlContext,
    ) => {
      const authUser = requireRole(context, ["ORGANIZER", "ADMIN"]);

      return publishEvent(args.id, authUser.userId, authUser.role);
    },

    cancelEvent: async (
      _parent: unknown,
      args: { id: string },
      context: IGraphQlContext,
    ) => {
      const authUser = requireRole(context, ["ORGANIZER", "ADMIN"]);

      return cancelEvent(args.id, authUser.userId, authUser.role);
    },
  },
  Event: {
    id: (event: any) => event._id.toString(),

    organizerId: (event: any) => event.organizerId.toString(),

    startDate: (event: any) => event.startDate.toISOString(),
    endDate: (event: any) => event.endDate.toISOString(),

    createdAt: (event: any) => event.createdAt.toISOString(),
    updatedAt: (event: any) => event.updatedAt.toISOString(),
    publishedAt: (event: any) =>
      event.publishedAt ? event.publishedAt.toISOString() : null,
  },
};
