import "dotenv/config";
import mongoose from "mongoose";
import { connectDb } from "../db/connect";
import { UserModel } from "../models/User";
import { ConversationModel } from "../models/Conversation";
import { MessageModel } from "../models/Message";
import { CallSessionModel } from "../models/CallSession";

const clearDatabase = async () => {
  await connectDb();

  await Promise.all([
    UserModel.deleteMany({}),
    ConversationModel.deleteMany({}),
    MessageModel.deleteMany({}),
    CallSessionModel.deleteMany({}),
  ]);

  console.log("Database cleared successfully.");
  await mongoose.disconnect();
};

clearDatabase().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
