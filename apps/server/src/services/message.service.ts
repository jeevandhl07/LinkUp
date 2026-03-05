import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { ConversationModel } from "../models/Conversation";
import { MessageModel } from "../models/Message";
import { AppError } from "../utils/AppError";

const assertMembership = async (conversationId: string, userId: string) => {
  const conversation = await ConversationModel.findById(conversationId);
  if (!conversation) {
    throw new AppError("Conversation not found", StatusCodes.NOT_FOUND);
  }
  const member = conversation.members.some((m) => m.userId.toString() === userId);
  if (!member) {
    throw new AppError("Forbidden", StatusCodes.FORBIDDEN);
  }
  return conversation;
};

export const messageService = {
  async listMessages(userId: string, conversationId: string, cursor?: string, limit = 20) {
    await assertMembership(conversationId, userId);

    const filter: Record<string, unknown> = { conversationId: new mongoose.Types.ObjectId(conversationId) };
    if (cursor) {
      filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    }

    const docs = await MessageModel.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = docs.length > limit;
    const sliced = hasMore ? docs.slice(0, limit) : docs;

    return {
      items: sliced.reverse(),
      nextCursor: hasMore ? sliced[sliced.length - 1]._id.toString() : null
    };
  },

  async sendMessage(userId: string, conversationId: string, content: string) {
    await assertMembership(conversationId, userId);
    const message = await MessageModel.create({
      conversationId,
      senderId: userId,
      content
    });

    await ConversationModel.findByIdAndUpdate(conversationId, { $set: { updatedAt: new Date() } });
    return message;
  },

  async addReaction(userId: string, messageId: string, emoji: string) {
    const message = await MessageModel.findById(messageId);
    if (!message) {
      throw new AppError("Message not found", StatusCodes.NOT_FOUND);
    }

    await assertMembership(message.conversationId.toString(), userId);

    const existing = message.reactions.find((r) => r.userId.toString() === userId && r.emoji === emoji);
    if (existing) {
      message.reactions = message.reactions.filter((r) => !(r.userId.toString() === userId && r.emoji === emoji));
    } else {
      message.reactions.push({ emoji, userId: new mongoose.Types.ObjectId(userId) });
    }

    await message.save();
    return message;
  }
};