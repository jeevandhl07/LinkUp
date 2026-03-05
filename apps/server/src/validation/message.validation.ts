import { z } from "zod";

export const listMessagesSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(50).default(20),
  }),
});

export const sendMessageSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    content: z.string().min(1).max(4000),
  }),
});

export const readConversationSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    lastReadMessageId: z.string().min(1),
  }),
});

export const reactMessageSchema = z.object({
  params: z.object({ messageId: z.string().min(1) }),
  body: z.object({
    emoji: z.string().min(1).max(8),
  }),
});
