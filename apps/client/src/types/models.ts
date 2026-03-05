export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
};

export type Member = {
  userId: string;
  role: "member" | "admin";
  joinedAt: string;
  lastReadMessageId?: string | null;
  user?: {
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string;
  };
};

export type Message = {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  reactions: Array<{ emoji: string; userId: string }>;
};

export type Conversation = {
  _id: string;
  type: "direct" | "group";
  title?: string;
  avatarUrl?: string;
  members: Member[];
  createdBy: string;
  updatedAt: string;
  lastMessage?: Message | null;
  unreadCount?: number;
  status?: "read" | "unread";
};

export type CallSession = {
  _id: string;
  type: "direct" | "group";
  conversationId?: string | null;
  participants: string[];
  status: "active" | "ended";
  createdBy: string;
};
