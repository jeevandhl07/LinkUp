import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";
import { env } from "./config/env";
import { connectDb } from "./db/connect";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import conversationRoutes from "./routes/conversation.routes";
import messageRoutes from "./routes/message.routes";
import callRoutes from "./routes/call.routes";
import { errorHandler, notFound } from "./middleware/error";
import { setupSocket } from "./socket";

const configuredOrigins = env.CLIENT_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const localNetworkOriginPattern =
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) return true;
  if (configuredOrigins.includes(origin)) return true;
  if (env.NODE_ENV !== "production" && localNetworkOriginPattern.test(origin))
    return true;
  return false;
};

const bootstrap = async () => {
  await connectDb();

  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("CORS origin not allowed"));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/v1/auth", authLimiter, authRoutes);
  app.use("/api/v1/users", userRoutes);
  app.use("/api/v1/conversations", conversationRoutes);
  app.use("/api/v1", messageRoutes);
  app.use("/api/v1/calls", callRoutes);

  app.use(notFound);
  app.use(errorHandler);

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Socket origin not allowed"));
      },
      credentials: true,
    },
  });

  setupSocket(io);

  server.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`LinkUp server running on http://localhost:${env.PORT}`);
  });
};

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
