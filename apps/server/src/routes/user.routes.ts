import { Router } from "express";
import { searchUsers, updateMe } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { searchUsersSchema, updateMeSchema } from "../validation/user.validation";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(authMiddleware);
router.patch("/me", validate(updateMeSchema), asyncHandler(updateMe));
router.get("/search", validate(searchUsersSchema), asyncHandler(searchUsers));

export default router;