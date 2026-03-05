import { Router } from "express";
import {
  addMembers,
  createDirect,
  createGroup,
  getConversation,
  leaveConversation,
  listConversations,
  removeMember,
  updateConversation
} from "../controllers/conversation.controller";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  addMembersSchema,
  conversationIdSchema,
  createDirectSchema,
  createGroupSchema,
  removeMemberSchema,
  updateConversationSchema
} from "../validation/conversation.validation";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authMiddleware);
router.post("/direct", validate(createDirectSchema), asyncHandler(createDirect));
router.post("/group", validate(createGroupSchema), asyncHandler(createGroup));
router.get("/", asyncHandler(listConversations));
router.get("/:id", validate(conversationIdSchema), asyncHandler(getConversation));
router.patch("/:id", validate(updateConversationSchema), asyncHandler(updateConversation));
router.post("/:id/members", validate(addMembersSchema), asyncHandler(addMembers));
router.delete("/:id/members/:userId", validate(removeMemberSchema), asyncHandler(removeMember));
router.post("/:id/leave", validate(conversationIdSchema), asyncHandler(leaveConversation));

export default router;