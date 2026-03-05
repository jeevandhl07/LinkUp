import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1),
  CLIENT_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  JWT_ACCESS_SECRET: z.string().min(12),
  JWT_REFRESH_SECRET: z.string().min(12),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  COOKIE_NAME: z.string().default("linkup_refresh"),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  STUN_URL: z.string().default("stun:stun.l.google.com:19302"),
  TURN_URL: z.string().optional().default(""),
  TURN_USERNAME: z.string().optional().default(""),
  TURN_CREDENTIAL: z.string().optional().default(""),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
