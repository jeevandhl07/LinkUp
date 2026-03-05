import mongoose, { InferSchemaType, Types } from "mongoose";

const callSessionSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", default: null },
    type: { type: String, enum: ["direct", "group"], required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    status: { type: String, enum: ["active", "ended"], default: "active" },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    metadata: {
      allowVideo: { type: Boolean, default: true },
      allowAudio: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

export type CallSessionDocument = InferSchemaType<typeof callSessionSchema> & { _id: Types.ObjectId };
export const CallSessionModel = mongoose.model("CallSession", callSessionSchema);