import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AuthRequest } from "../types/auth";
import { userService } from "../services/user.service";

export const updateMe = async (req: AuthRequest, res: Response) => {
  const user = await userService.updateMe(req.user!.userId, req.body);
  res.status(StatusCodes.OK).json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
    },
  });
};

export const searchUsers = async (req: AuthRequest, res: Response) => {
  const users = await userService.searchUsers(
    req.user!.userId,
    String(req.query.q || ""),
  );
  res.status(StatusCodes.OK).json({
    users: users.map((user: any) => ({
      id: user._id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
    })),
  });
};
