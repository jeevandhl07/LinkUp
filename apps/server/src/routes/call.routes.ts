import { Router } from "express";
import { createCall, endCall, getCall } from "../controllers/call.controller";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { callIdSchema, createCallSchema } from "../validation/call.validation";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authMiddleware);
router.post("/", validate(createCallSchema), asyncHandler(createCall));
router.get("/:callId", validate(callIdSchema), asyncHandler(getCall));
router.post("/:callId/end", validate(callIdSchema), asyncHandler(endCall));

export default router;
