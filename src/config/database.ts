import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const DEFAULT_URI = "mongodb://127.0.0.1:27017/hackathon";

export const connectDatabase = async () => {
  const mongoUri =  process.env.MONGO_URI||DEFAULT_URI;

  await mongoose.connect(mongoUri);

  // eslint-disable-next-line no-console
  console.log("MongoDB connected");
};
