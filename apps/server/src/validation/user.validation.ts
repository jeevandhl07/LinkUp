import { z } from "zod";

export const updateMeSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(40).optional(),
    avatarUrl: z.string().url().or(z.literal("")).optional(),
    bio: z.string().max(200).optional()
  })
});

export const searchUsersSchema = z.object({
  query: z.object({
    q: z.string().optional().default("")
  })
});
