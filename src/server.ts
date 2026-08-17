import "dotenv/config";
import app from "./app.js";
import { connectDb } from "./config/db.js";

const port = process.env.PORT || 4000;

const startServer = async () => {
  await connectDb();
  app.listen(port, () => {
    console.log("server started in port", port, "successfully");
  });
};

startServer();
