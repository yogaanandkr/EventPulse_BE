import { authResolvers, userResolver } from "../modules/auth/auth.resolver.js";
import { requireAuth } from "../utils/requireAuth.js";
import { User } from "../models/User.js";
import { eventResolvers } from "../modules/event/event.resolver.js";
import { ticketResolvers } from "../modules/ticket/ticket.resolver.js";

export const resolvers = {
  Query: {
    health: () => {
      return "EventPulse API is healthy";
    },

    me: async (_parent: unknown, _args: unknown, context: any) => {
      const authUser = requireAuth(context);

      const user = await User.findById(authUser.userId);

      if (!user) {
        throw new Error("User not found");
      }

      return user;
    },

    ...eventResolvers.Query,
    ...ticketResolvers.Query
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...eventResolvers.Mutation,
    ...ticketResolvers.Mutation
  },

  User: {
    id: (user: any) => user._id.toString(),
  },
};
