import { GraphQLError } from "graphql";

import { createPaymentOrder, verifyRazorpayPayment } from "./payment.service.js";

export interface GraphQLContext {
  user: {
    userId: string;
    role: string;
  } | null;
}

const paymentResolvers = {
  Mutation: {
    createPaymentOrder: async (
      _parent: unknown,
      args: { bookingId: string },
      context: GraphQLContext,
    ) => {
      if (!context.user) {
        throw new GraphQLError("You must be logged in.", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      if (context.user.role !== "CUSTOMER") {
        throw new GraphQLError("Only customers can initiate payments.", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      return createPaymentOrder(context.user.userId, args.bookingId);
    },
    verifyRazorpayPayment: async (
      _parent: unknown,
      args: {
        input: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        };
      },
      context: GraphQLContext,
    ) => {
      if (!context.user) {
        throw new GraphQLError("You must be logged in.", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      if (context.user.role !== "CUSTOMER") {
        throw new GraphQLError("Only customers can verify payments.", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      return verifyRazorpayPayment(context.user.userId, args.input);
    },
  },
};

export default paymentResolvers;
