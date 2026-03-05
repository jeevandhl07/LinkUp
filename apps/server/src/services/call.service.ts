import { StatusCodes } from "http-status-codes";
import { CallSessionModel } from "../models/CallSession";
import { ConversationModel } from "../models/Conversation";
import { AppError } from "../utils/AppError";

export const callService = {
  async createCall(userId: string, input: { type: "direct" | "group"; conversationId?: string; participantIds?: string[] }) {
    let participants: string[] = [];

    if (input.conversationId) {
      const conversation = await ConversationModel.findById(input.conversationId);
      if (!conversation) {
        throw new AppError("Conversation not found", StatusCodes.NOT_FOUND);
      }

      const isMember = conversation.members.some((m) => m.userId.toString() === userId);
      if (!isMember) {
        throw new AppError("Forbidden", StatusCodes.FORBIDDEN);
      }

      participants = conversation.members.map((m) => m.userId.toString());
    } else if (input.participantIds) {
      participants = [...new Set([userId, ...input.participantIds])];
    }

    if (participants.length < 2) {
      throw new AppError("Call requires at least 2 participants", StatusCodes.BAD_REQUEST);
    }

    const call = await CallSessionModel.create({
      type: input.type,
      conversationId: input.conversationId ?? null,
      createdBy: userId,
      participants,
      status: "active"
    });

    return call;
  },

  async getCall(userId: string, callId: string) {
    const call = await CallSessionModel.findById(callId);
    if (!call) {
      throw new AppError("Call not found", StatusCodes.NOT_FOUND);
    }

    if (!call.participants.some((p) => p.toString() === userId)) {
      throw new AppError("Forbidden", StatusCodes.FORBIDDEN);
    }

    return call;
  },

  async endCall(userId: string, callId: string) {
    const call = await CallSessionModel.findById(callId);
    if (!call) {
      throw new AppError("Call not found", StatusCodes.NOT_FOUND);
    }

    if (call.createdBy.toString() !== userId) {
      throw new AppError("Only creator can end call", StatusCodes.FORBIDDEN);
    }

    call.status = "ended";
    call.endedAt = new Date();
    await call.save();
    return call;
  }
};