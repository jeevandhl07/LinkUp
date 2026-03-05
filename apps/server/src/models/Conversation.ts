import mongoose, { InferSchemaType, Types } from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: { type: String, enum: ["member", "admin"], default: "member" },
    joinedAt: { type: Date, default: Date.now },
    lastReadMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { _id: false },
);

const conversationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["direct", "group"], required: true },
    title: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    members: { type: [memberSchema], required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

conversationSchema.index({ "members.userId": 1, updatedAt: -1 });

export type ConversationDocument = InferSchemaType<
  typeof conversationSchema
> & { _id: Types.ObjectId };
export const ConversationModel = mongoose.model(
  "Conversation",
  conversationSchema,
);
