import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { ConversationModel } from "../models/Conversation";
import { MessageModel } from "../models/Message";
import { AppError } from "../utils/AppError";

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

const normalizeMessage = (message: any) => ({
  _id: message._id.toString(),
  conversationId: message.conversationId.toString(),
  senderId: message.senderId.toString(),
  content: message.content,
  createdAt: message.createdAt,
  reactions: (message.reactions || []).map((reaction: any) => ({
    emoji: reaction.emoji,
    userId: reaction.userId.toString()
  }))
});

const getMemberUserId = (member: any): string => {
  if (member.userId && typeof member.userId === "object" && "_id" in member.userId) {
    return member.userId._id.toString();
  }
  return member.userId.toString();
};

const normalizeMember = (member: any) => {
  const populated = member.userId && typeof member.userId === "object" && "_id" in member.userId;
  const userId = getMemberUserId(member);

  return {
    userId,
    role: member.role,
    joinedAt: member.joinedAt,
    lastReadMessageId: member.lastReadMessageId ? member.lastReadMessageId.toString() : null,
    user: populated
      ? {
          id: member.userId._id.toString(),
          name: member.userId.name,
          email: member.userId.email,
          avatarUrl: member.userId.avatarUrl || ""
        }
      : undefined
  };
};

const shapeConversation = (conversation: any, currentUserId: string, lastMessage: any = null, unreadCount = 0) => {
  const members = (conversation.members || []).map(normalizeMember);
  let title = conversation.title || "";
  let avatarUrl = conversation.avatarUrl || "";

  if (conversation.type === "direct") {
    const other = members.find((member: any) => member.userId !== currentUserId) || members[0];
    title = other?.user?.name || "Direct Chat";
    avatarUrl = other?.user?.avatarUrl || avatarUrl;
  }

  return {
    _id: conversation._id.toString(),
    type: conversation.type,
    title,
    avatarUrl,
    members,
    createdBy: conversation.createdBy.toString(),
    updatedAt: conversation.updatedAt,
    lastMessage: lastMessage ? normalizeMessage(lastMessage) : null,
    unreadCount,
    status: unreadCount > 0 ? "unread" : "read"
  };
};

const getLastMessage = async (conversationId: string) => {
  return MessageModel.findOne({ conversationId: toObjectId(conversationId) }).sort({ _id: -1 }).lean();
};

const getUnreadCount = async (conversation: any, userId: string) => {
  const member = (conversation.members || []).find((item: any) => getMemberUserId(item) === userId);
  if (!member) return 0;

  const filter: Record<string, any> = { conversationId: conversation._id };
  if (member.lastReadMessageId) {
    filter._id = { $gt: toObjectId(member.lastReadMessageId.toString()) };
  }

  return MessageModel.countDocuments(filter);
};

const findConversationForUser = async (conversationId: string, userId: string) => {
  const conversation = await ConversationModel.findById(conversationId).populate("members.userId", "_id name email avatarUrl");
  if (!conversation) {
    throw new AppError("Conversation not found", StatusCodes.NOT_FOUND);
  }

  const membership = conversation.members.find((member) => getMemberUserId(member) === userId);
  if (!membership) {
    throw new AppError("Forbidden", StatusCodes.FORBIDDEN);
  }

  return conversation;
};

const ensureAdmin = (conversation: any, userId: string) => {
  const membership = conversation.members.find((member: any) => getMemberUserId(member) === userId);
  if (!membership || membership.role !== "admin") {
    throw new AppError("Admin permission required", StatusCodes.FORBIDDEN);
  }
};

export const conversationService = {
  async createOrGetDirect(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new AppError("Cannot create direct chat with yourself", StatusCodes.BAD_REQUEST);
    }

    let conversation = await ConversationModel.findOne({
      type: "direct",
      "members.userId": { $all: [toObjectId(currentUserId), toObjectId(targetUserId)] },
      $expr: { $eq: [{ $size: "$members" }, 2] }
    });

    if (!conversation) {
      conversation = await ConversationModel.create({
        type: "direct",
        members: [
          { userId: currentUserId, role: "member", joinedAt: new Date() },
          { userId: targetUserId, role: "member", joinedAt: new Date() }
        ],
        createdBy: currentUserId
      });
    }

    return this.getConversation(currentUserId, conversation._id.toString());
  },

  async createGroup(currentUserId: string, input: { title: string; avatarUrl?: string; memberIds: string[] }) {
    const uniqueMemberIds = [...new Set([currentUserId, ...input.memberIds])];

    const conversation = await ConversationModel.create({
      type: "group",
      title: input.title,
      avatarUrl: input.avatarUrl ?? "",
      members: uniqueMemberIds.map((id) => ({
        userId: id,
        role: id === currentUserId ? "admin" : "member",
        joinedAt: new Date()
      })),
      createdBy: currentUserId
    });

    return this.getConversation(currentUserId, conversation._id.toString());
  },

  async listMyConversations(userId: string) {
    const conversations = await ConversationModel.find({ "members.userId": userId })
      .populate("members.userId", "_id name email avatarUrl")
      .sort({ updatedAt: -1 });

    return Promise.all(
      conversations.map(async (conversation) => {
        const [lastMessage, unreadCount] = await Promise.all([
          getLastMessage(conversation._id.toString()),
          getUnreadCount(conversation, userId)
        ]);
        return shapeConversation(conversation, userId, lastMessage, unreadCount);
      })
    );
  },

  async getConversation(userId: string, conversationId: string) {
    const conversation = await findConversationForUser(conversationId, userId);
    const [lastMessage, unreadCount] = await Promise.all([
      getLastMessage(conversationId),
      getUnreadCount(conversation, userId)
    ]);
    return shapeConversation(conversation, userId, lastMessage, unreadCount);
  },

  async updateConversation(userId: string, conversationId: string, input: { title?: string; avatarUrl?: string }) {
    const conversation = await findConversationForUser(conversationId, userId);
    if (conversation.type !== "group") {
      throw new AppError("Only groups can be updated", StatusCodes.BAD_REQUEST);
    }

    ensureAdmin(conversation, userId);

    if (typeof input.title !== "undefined") {
      conversation.title = input.title;
    }
    if (typeof input.avatarUrl !== "undefined") {
      conversation.avatarUrl = input.avatarUrl;
    }

    await conversation.save();
    return shapeConversation(conversation, userId);
  },

  async addMembers(userId: string, conversationId: string, memberIds: string[]) {
    const conversation = await findConversationForUser(conversationId, userId);
    if (conversation.type !== "group") {
      throw new AppError("Only groups can add members", StatusCodes.BAD_REQUEST);
    }

    ensureAdmin(conversation, userId);

    const existingIds = new Set(conversation.members.map((member: any) => getMemberUserId(member)));
    memberIds.forEach((id) => {
      if (!existingIds.has(id)) {
        conversation.members.push({
          userId: toObjectId(id),
          role: "member",
          joinedAt: new Date(),
          lastReadMessageId: null
        } as any);
      }
    });

    await conversation.save();
    await conversation.populate("members.userId", "_id name email avatarUrl");
    return shapeConversation(conversation, userId);
  },

  async removeMember(userId: string, conversationId: string, targetUserId: string) {
    const conversation = await findConversationForUser(conversationId, userId);
    if (conversation.type !== "group") {
      throw new AppError("Only groups can remove members", StatusCodes.BAD_REQUEST);
    }

    ensureAdmin(conversation, userId);
    conversation.members = conversation.members.filter((member: any) => getMemberUserId(member) !== targetUserId) as any;
    await conversation.save();
    await conversation.populate("members.userId", "_id name email avatarUrl");
    return shapeConversation(conversation, userId);
  },

  async leaveConversation(userId: string, conversationId: string) {
    const conversation = await findConversationForUser(conversationId, userId);
    conversation.members = conversation.members.filter((member: any) => getMemberUserId(member) !== userId) as any;

    if (conversation.members.length === 0) {
      await conversation.deleteOne();
      return { deleted: true };
    }

    await conversation.save();
    await conversation.populate("members.userId", "_id name email avatarUrl");
    return { deleted: false, conversation: shapeConversation(conversation, userId) };
  },

  async updateRead(userId: string, conversationId: string, lastReadMessageId: string) {
    const conversation = await findConversationForUser(conversationId, userId);
    const member = conversation.members.find((item: any) => getMemberUserId(item) === userId);
    if (!member) {
      throw new AppError("Forbidden", StatusCodes.FORBIDDEN);
    }

    member.lastReadMessageId = toObjectId(lastReadMessageId);
    await conversation.save();
    await conversation.populate("members.userId", "_id name email avatarUrl");
    return shapeConversation(conversation, userId, null, 0);
  }
};
