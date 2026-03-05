import { z } from "zod";

export const createCallSchema = z.object({
  body: z.object({
    type: z.enum(["direct", "group"]),
    conversationId: z.string().optional(),
    participantIds: z.array(z.string().min(1)).min(1).optional(),
  }),
});

export const callIdSchema = z.object({
  params: z.object({
    callId: z.string().min(1),
  }),
});
