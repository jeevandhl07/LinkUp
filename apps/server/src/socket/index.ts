import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";
import { messageService } from "../services/message.service";
import { conversationService } from "../services/conversation.service";
import { callService } from "../services/call.service";
import { ConversationModel } from "../models/Conversation";

const room = {
  user: (userId: string) => `user:${userId}`,
  conversation: (conversationId: string) => `conversation:${conversationId}`,
  call: (callId: string) => `call:${callId}`,
};

type AuthedSocket = Socket & { userId?: string };

export const setupSocket = (io: Server): void => {
  io.use((socket, next) => {
    try {
      const raw = socket.handshake.auth?.token as string | undefined;
      const token = raw?.startsWith("Bearer ") ? raw.split(" ")[1] : raw;
      if (!token) {
        return next(new Error("Unauthorized"));
      }
      const payload = verifyAccessToken(token);
      (socket as AuthedSocket).userId = payload.userId;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: AuthedSocket) => {
    const userId = socket.userId!;
    socket.join(room.user(userId));

    const safeOn = (
      event: string,
      handler: (payload: any) => Promise<void> | void,
    ) => {
      socket.on(event, (payload) => {
        Promise.resolve(handler(payload)).catch((error: Error) => {
          socket.emit("socket:error", {
            event,
            message: error.message || "Socket handler failed",
          });
        });
      });
    };

    safeOn("conversation:join", async ({ conversationId }) => {
      await conversationService.getConversation(userId, conversationId);
      socket.join(room.conversation(conversationId));
    });

    safeOn("conversation:leave", ({ conversationId }) => {
      socket.leave(room.conversation(conversationId));
    });

    safeOn("message:send", async ({ conversationId, content }) => {
      const message = await messageService.sendMessage(
        userId,
        conversationId,
        content,
      );

      const conversation = await ConversationModel.findById(conversationId)
        .select("members.userId")
        .lean();
      const memberIds = (conversation?.members || []).map((member: any) =>
        member.userId.toString(),
      );

      memberIds.forEach((memberId) => {
        io.to(room.user(memberId)).emit("message:new", { message });
      });
    });

    safeOn("typing:start", ({ conversationId }) => {
      socket.to(room.conversation(conversationId)).emit("typing:update", {
        conversationId,
        userId,
        isTyping: true,
      });
    });

    safeOn("typing:stop", ({ conversationId }) => {
      socket.to(room.conversation(conversationId)).emit("typing:update", {
        conversationId,
        userId,
        isTyping: false,
      });
    });

    safeOn("read:update", async ({ conversationId, lastReadMessageId }) => {
      await conversationService.updateRead(
        userId,
        conversationId,
        lastReadMessageId,
      );
      io.to(room.conversation(conversationId)).emit("read:updated", {
        conversationId,
        userId,
        lastReadMessageId,
      });
    });

    safeOn("call:invite", ({ callId, participantIds }) => {
      participantIds.forEach((id: string) => {
        io.to(room.user(id)).emit("call:incoming", {
          callId,
          fromUserId: userId,
        });
      });
    });

    safeOn("call:accept", async ({ callId }) => {
      const call = await callService.getCall(userId, callId);
      io.to(room.call(callId)).emit("call:accept", { callId, userId });
      socket.join(room.call(callId));
      io.to(room.call(callId)).emit("call:join", {
        callId,
        userId,
        participants: call.participants,
      });
    });

    safeOn("call:decline", ({ callId, toUserId }) => {
      io.to(room.user(toUserId)).emit("call:decline", { callId, userId });
    });

    safeOn("call:cancel", async ({ callId }) => {
      const call = await callService.getCall(userId, callId);
      const participantIds = call.participants.map((participant) =>
        participant.toString(),
      );

      participantIds.forEach((participantId) => {
        io.to(room.user(participantId)).emit("call:canceled", {
          callId,
          userId,
        });
      });

      io.to(room.call(callId)).emit("call:canceled", { callId, userId });
      io.to(room.call(callId)).emit("call:ended", { callId, userId });
    });

    safeOn("call:camera", ({ callId, cameraOff }) => {
      io.to(room.call(callId)).emit("call:camera", { callId, userId, cameraOff });
    });

    safeOn("call:join", async ({ callId }) => {
      const call = await callService.getCall(userId, callId);
      socket.join(room.call(callId));
      io.to(room.call(callId)).emit("call:join", {
        callId,
        userId,
        participants: call.participants,
      });
    });

    safeOn("call:leave", ({ callId }) => {
      socket.leave(room.call(callId));
      io.to(room.call(callId)).emit("call:leave", { callId, userId });
    });

    safeOn("call:ended", ({ callId }) => {
      io.to(room.call(callId)).emit("call:ended", { callId, userId });
    });

    safeOn("webrtc:offer", ({ callId, toUserId, offer }) => {
      io.to(room.user(toUserId)).emit("webrtc:offer", {
        callId,
        fromUserId: userId,
        offer,
      });
    });

    safeOn("webrtc:answer", ({ callId, toUserId, answer }) => {
      io.to(room.user(toUserId)).emit("webrtc:answer", {
        callId,
        fromUserId: userId,
        answer,
      });
    });

    safeOn("webrtc:ice-candidate", ({ callId, toUserId, candidate }) => {
      io.to(room.user(toUserId)).emit("webrtc:ice-candidate", {
        callId,
        fromUserId: userId,
        candidate,
      });
    });
  });
};
