import mongoose from "mongoose";
import { env } from "../config/env";

export const connectDb = async (): Promise<void> => {
  await mongoose.connect(env.MONGO_URI);
};