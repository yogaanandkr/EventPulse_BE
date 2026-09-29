import type { IGraphQlContext } from "../../graphql/graphql.types.js";
import { requireRole } from "../../utils/requireRoles.js";
import { createTicketType, getTicketTypes, updateTicketType } from "./ticket.service.js";


export const ticketResolvers = {
  Query: {
    ticketTypes: async (
      _parent: unknown,
      args: {
        eventId: string;
      },
    ) => {
      return getTicketTypes(args.eventId);
    },
  },

  Mutation: {
    createTicketType: async (
      _parent: unknown,
      args: {
        input: {
          eventId: string;
          name: string;
          description?: string;
          price: number;
          currency?: string;
          totalQuantity: number;
          saleStartDate?: string;
          saleEndDate?: string;
        };
      },
      context: IGraphQlContext,
    ) => {
      const authUser = requireRole(context, ["ORGANIZER", "ADMIN"]);

      return createTicketType(authUser.userId, authUser.role, args.input);
    },

    updateTicketType: async (
      _parent: unknown,
      args: {
        id: string;
        input: any;
      },
      context: IGraphQlContext,
    ) => {
      const authUser = requireRole(context, ["ORGANIZER", "ADMIN"]);

      return updateTicketType(
        args.id,
        authUser.userId,
        authUser.role,
        args.input,
      );
    },
  },

  TicketType: {
    id: (ticket: any) => ticket._id.toString(),

    eventId: (ticket: any) => ticket.eventId.toString(),

    createdAt: (ticket: any) => ticket.createdAt.toISOString(),

    updatedAt: (ticket: any) => ticket.updatedAt.toISOString(),

    saleStartDate: (ticket: any) =>
      ticket.saleStartDate ? ticket.saleStartDate.toISOString() : null,

    saleEndDate: (ticket: any) =>
      ticket.saleEndDate ? ticket.saleEndDate.toISOString() : null,
  },
};
