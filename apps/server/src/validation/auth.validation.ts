import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    name: z.string().min(2).max(40),
    password: z.string().min(8)
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
});