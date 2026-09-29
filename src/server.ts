import "dotenv/config";
import app, { setupGraphQL } from "./app.js";
import { connectDb } from "./config/db.js";
import { apolloServer } from "./graphql/schema.js";

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  await connectDb();
  await apolloServer.start();
  setupGraphQL();
  app.listen(PORT, () => {
    console.log("server started in PORT", PORT, "successfully");
    console.log(`GraphQL running at http://localhost:${PORT}/graphql`);
  });
};

startServer();
