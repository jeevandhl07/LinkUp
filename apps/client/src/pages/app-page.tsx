import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { callsApi, conversationsApi, usersApi } from "../api/endpoints";
import { Thread } from "../components/chat/thread";
import { Sidebar } from "../components/layout/sidebar";
import { Skeleton } from "../components/ui/skeleton";
import { useToast } from "../components/ui/toast";
import { useAuth } from "../context/auth-context";
import { useSocket } from "../context/socket-context";
import { useConversations } from "../hooks/use-conversations";
import { useMessages } from "../hooks/use-messages";
import { Conversation, Message, User } from "../types/models";

export const AppPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { push } = useToast();
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const { listQuery, createDirect, createGroup } = useConversations();
  const conversations = listQuery.data || [];

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === selectedId),
    [conversations, selectedId]
  );

  const { query: messagesQuery } = useMessages(selectedId);
  const messages = messagesQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const hasMore = Boolean(messagesQuery.hasNextPage);

  useEffect(() => {
    if (!socket || !selectedId) return;
    socket.emit("conversation:join", { conversationId: selectedId });
    return () => {
      socket.emit("conversation:leave", { conversationId: selectedId });
    };
  }, [selectedId, socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on("message:new", ({ message }: { message: Message }) => {
      queryClient.setQueryData<any>(["messages", message.conversationId], (prev: any) => {
        if (!prev) return { pages: [{ items: [message], nextCursor: null }], pageParams: [undefined] };
        const next = { ...prev };
        const last = next.pages[next.pages.length - 1];
        last.items = [...last.items, message];
        return next;
      });

      queryClient.setQueryData<Conversation[]>(["conversations"], (prev = []) =>
        prev.map((conversation) => {
          if (conversation._id !== message.conversationId) return conversation;

          const isMine = message.senderId === user?.id;
          const isActiveConversation = selectedId === message.conversationId;
          const unreadCount = isMine || isActiveConversation ? 0 : (conversation.unreadCount || 0) + 1;

          return {
            ...conversation,
            lastMessage: message,
            unreadCount,
            updatedAt: new Date().toISOString()
          };
        })
      );
    });

    socket.on("typing:update", ({ conversationId, userId, isTyping }) => {
      if (conversationId !== selectedId || userId === user?.id) return;
      setTypingUsers((prev) => (isTyping ? [...new Set([...prev, userId])] : prev.filter((id) => id !== userId)));
    });

    socket.on("call:incoming", ({ callId }) => {
      push("Incoming call");
      navigate(`/app/calls/${callId}`);
    });

    return () => {
      socket.off("message:new");
      socket.off("typing:update");
      socket.off("call:incoming");
    };
  }, [navigate, push, queryClient, selectedId, socket, user?.id]);

  useEffect(() => {
    if (!socket || !selectedId || !selectedConversation || messages.length === 0) return;
    const lastReadMessageId = messages[messages.length - 1]._id;
    socket.emit("read:update", { conversationId: selectedId, lastReadMessageId });
    void conversationsApi.markRead(selectedId, lastReadMessageId).catch(() => undefined);

    queryClient.setQueryData<Conversation[]>(["conversations"], (prev = []) =>
      prev.map((conversation) =>
        conversation._id === selectedId ? { ...conversation, unreadCount: 0 } : conversation
      )
    );
  }, [messages, selectedConversation, selectedId, socket, queryClient]);

  const sendMessage = (content: string) => {
    if (!selectedId || !socket) return;
    socket.emit("message:send", { conversationId: selectedId, content });
  };

  const handleTyping = (typing: boolean) => {
    if (!selectedId || !socket) return;
    socket.emit(typing ? "typing:start" : "typing:stop", { conversationId: selectedId });
  };

  const startCall = async () => {
    if (!selectedConversation) return;
    const payload =
      selectedConversation.type === "group"
        ? { type: "group" as const, conversationId: selectedConversation._id }
        : {
            type: "direct" as const,
            conversationId: selectedConversation._id,
            participantIds: selectedConversation.members.map((member) => member.userId)
          };

    const data = await callsApi.create(payload);
    socket?.emit("call:invite", {
      callId: data.callId,
      participantIds: data.participants.filter((id) => id !== user?.id)
    });
    navigate(`/app/calls/${data.callId}`);
  };

  if (listQuery.isLoading) {
    return (
      <div className="grid h-screen grid-cols-12 gap-0">
        <Skeleton className="col-span-4 h-full" />
        <Skeleton className="col-span-8 h-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <div className={`${mobileView === "list" ? "block" : "hidden"} h-full w-full md:block md:w-[360px]`}>
        <Sidebar
          conversations={conversations}
          selectedId={selectedId}
          currentUser={user}
          onSelect={(id) => {
            setSelectedId(id);
            setMobileView("chat");
          }}
          onSearchUsers={async (q) => (await usersApi.search(q)).users as User[]}
          onCreateDirect={(userId) =>
            void createDirect.mutateAsync(userId).then((response) => {
              setSelectedId(response.conversation._id);
              setMobileView("chat");
            })
          }
          onCreateGroup={(title, memberIds) =>
            void createGroup.mutateAsync({ title, memberIds }).then((response) => {
              setSelectedId(response.conversation._id);
              setMobileView("chat");
            })
          }
          onLogout={() => void logout()}
        />
      </div>

      <div className={`${mobileView === "chat" ? "flex" : "hidden"} min-w-0 flex-1 md:flex`}>
        {selectedConversation ? (
          <Thread
            conversation={selectedConversation}
            messages={messages}
            me={user}
            typingUsers={typingUsers}
            onSend={sendMessage}
            onTyping={handleTyping}
            onLoadMore={() => void messagesQuery.fetchNextPage()}
            hasMore={hasMore}
            onBackToList={() => setMobileView("list")}
            onStartCall={() => void startCall()}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-bg text-center text-muted">
            <div>
              <p className="text-base font-medium">Select a conversation</p>
              <p className="mt-1 text-sm">Choose a chat from the left sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
