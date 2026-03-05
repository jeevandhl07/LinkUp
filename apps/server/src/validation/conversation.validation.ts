import { z } from "zod";

export const createDirectSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
  }),
});

export const createGroupSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(80),
    avatarUrl: z.string().url().or(z.literal("")).optional(),
    memberIds: z.array(z.string().min(1)).min(1),
  }),
});

export const conversationIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const updateConversationSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(2).max(80).optional(),
    avatarUrl: z.string().url().or(z.literal("")).optional(),
  }),
});

export const addMembersSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    memberIds: z.array(z.string().min(1)).min(1),
  }),
});

export const removeMemberSchema = z.object({
  params: z.object({
    id: z.string().min(1),
    userId: z.string().min(1),
  }),
});
