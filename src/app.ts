import { expressMiddleware } from "@as-integrations/express5";
import cors from "cors";
import express from "express";
import { apolloServer } from "./graphql/schema.js";
import { createContext } from "./graphql/context.js";
import cookieParser from "cookie-parser";
const app = express();
interface dummy {
  name: string;
}

let dummyvar: dummy = {
  name: 500,
};
app.use(
  cors({
    origin: "http://localhost:5173",
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
    expressMiddleware(apolloServer, {
      context: async ({ req, res }) => {
        return createContext({ req, res });
      },
    }),
  );
};

export default app;
