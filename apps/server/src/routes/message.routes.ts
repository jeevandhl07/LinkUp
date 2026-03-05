import { Router } from "express";
import { readConversation } from "../controllers/conversation.controller";
import {
  listMessages,
  reactMessage,
  sendMessage,
} from "../controllers/message.controller";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  listMessagesSchema,
  reactMessageSchema,
  readConversationSchema,
  sendMessageSchema,
} from "../validation/message.validation";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authMiddleware);
router.get(
  "/conversations/:id/messages",
  validate(listMessagesSchema),
  asyncHandler(listMessages),
);
router.post(
  "/conversations/:id/messages",
  validate(sendMessageSchema),
  asyncHandler(sendMessage),
);
router.patch(
  "/conversations/:id/read",
  validate(readConversationSchema),
  asyncHandler(readConversation),
);
router.post(
  "/messages/:messageId/reactions",
  validate(reactMessageSchema),
  asyncHandler(reactMessage),
);

export default router;
