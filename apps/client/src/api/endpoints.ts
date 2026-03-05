import { api } from "./http";
import { Conversation, Message, User, CallSession } from "../types/models";

export const authApi = {
  register: async (payload: { email: string; name: string; password: string }) => (await api.post("/auth/register", payload)).data,
  login: async (payload: { email: string; password: string }) => (await api.post("/auth/login", payload)).data,
  logout: async () => (await api.post("/auth/logout")).data,
  me: async (): Promise<{ user: User }> => (await api.get("/auth/me")).data
};

export const usersApi = {
  updateMe: async (payload: Partial<User>) => (await api.patch("/users/me", payload)).data,
  search: async (q: string): Promise<{ users: User[] }> => (await api.get(`/users/search?q=${encodeURIComponent(q)}`)).data
};

export const conversationsApi = {
  createDirect: async (userId: string): Promise<{ conversation: Conversation }> => (await api.post("/conversations/direct", { userId })).data,
  createGroup: async (payload: { title: string; avatarUrl?: string; memberIds: string[] }): Promise<{ conversation: Conversation }> =>
    (await api.post("/conversations/group", payload)).data,
  list: async (): Promise<{ conversations: Conversation[] }> => (await api.get("/conversations")).data,
  get: async (id: string): Promise<{ conversation: Conversation }> => (await api.get(`/conversations/${id}`)).data,
  update: async (id: string, payload: { title?: string; avatarUrl?: string }) => (await api.patch(`/conversations/${id}`, payload)).data,
  addMembers: async (id: string, memberIds: string[]) => (await api.post(`/conversations/${id}/members`, { memberIds })).data,
  removeMember: async (id: string, userId: string) => (await api.delete(`/conversations/${id}/members/${userId}`)).data,
  leave: async (id: string) => (await api.post(`/conversations/${id}/leave`)).data,
  markRead: async (id: string, lastReadMessageId: string) => (await api.patch(`/conversations/${id}/read`, { lastReadMessageId })).data
};

export const messagesApi = {
  list: async (conversationId: string, cursor?: string, limit = 20): Promise<{ items: Message[]; nextCursor: string | null }> => {
    const query = new URLSearchParams();
    if (cursor) query.set("cursor", cursor);
    query.set("limit", String(limit));
    return (await api.get(`/conversations/${conversationId}/messages?${query.toString()}`)).data;
  },
  send: async (conversationId: string, content: string): Promise<{ message: Message }> =>
    (await api.post(`/conversations/${conversationId}/messages`, { content })).data,
  react: async (messageId: string, emoji: string): Promise<{ message: Message }> => (await api.post(`/messages/${messageId}/reactions`, { emoji })).data
};

export const callsApi = {
  create: async (payload: { type: "direct" | "group"; conversationId?: string; participantIds?: string[] }): Promise<{ callId: string; participants: string[]; call: CallSession }> =>
    (await api.post("/calls", payload)).data,
  get: async (callId: string): Promise<{ call: CallSession }> => (await api.get(`/calls/${callId}`)).data,
  end: async (callId: string): Promise<{ call: CallSession }> => (await api.post(`/calls/${callId}/end`)).data
};