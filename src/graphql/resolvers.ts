import { authResolvers, userResolver } from "../modules/auth/auth.resolver.js";
import { requireAuth } from "../utils/requireAuth.js";
import { User } from "../models/User.js";
import { eventResolvers } from "../modules/event/event.resolver.js";
import { ticketResolvers } from "../modules/ticket/ticket.resolver.js";
import reservationResolvers from "../modules/reservation/reservation.resolver.js";
import paymentResolvers from "../modules/payment/payment.resolver.js";

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
    ...ticketResolvers.Query,
    ...reservationResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...eventResolvers.Mutation,
    ...ticketResolvers.Mutation,
    ...reservationResolvers.Mutation,
    ...paymentResolvers.Mutation
  },

  User: {
    id: (user: any) => user._id.toString(),
  },
};
