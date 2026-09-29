import { ApolloServer } from "@apollo/server";
import { typeDefs } from "./typeDefs.js";
import { resolvers } from "./resolvers.js";
import { eventTypeDefs } from "../modules/event/event.typeDefs.js";
import { ticketTypeDefs } from "../modules/ticket/ticket.typeDefs.js";
export const apolloServer = new ApolloServer({
  typeDefs: [typeDefs, eventTypeDefs, ticketTypeDefs],
  resolvers,
});
