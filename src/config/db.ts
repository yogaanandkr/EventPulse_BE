import mongoose from "mongoose";

export const connectDb = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI ?? "");
    console.log("Mongo db connected successfuly");
  } catch (error) {
    console.log("error connecting to mongo db", error);
  }
};
