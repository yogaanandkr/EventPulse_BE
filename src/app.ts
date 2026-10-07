import { expressMiddleware } from "@as-integrations/express5";
import cors from "cors";
import express from "express";
import { apolloServer } from "./graphql/schema.js";
import { createContext } from "./graphql/context.js";
import cookieParser from "cookie-parser";
const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());
app.get("/", (_req, res) => {
  res.json({
    message: "event pulse api is running",
  });
});
export const setupGraphQL = () => {
  app.use(
    "/graphql",
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
    expressMiddleware(apolloServer, {
      context: async ({ req, res }) => {
        return createContext({ req, res });
      },
    }),
  );
};


export default app;
