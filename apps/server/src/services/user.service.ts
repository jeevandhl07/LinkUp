import { StatusCodes } from "http-status-codes";
import { UserModel } from "../models/User";
import { AppError } from "../utils/AppError";

export const userService = {
  async updateMe(
    userId: string,
    updates: { name?: string; avatarUrl?: string; bio?: string },
  ) {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true },
    ).select("-passwordHash");

    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    return user;
  },

  async searchUsers(userId: string, q: string) {
    const hasQuery = q.trim().length > 0;
    const regex = new RegExp(q, "i");

    const filter = hasQuery
      ? {
          _id: { $ne: userId },
          $or: [{ email: regex }, { name: regex }],
        }
      : {
          _id: { $ne: userId },
        };

    return UserModel.find(filter)
      .select("_id name email avatarUrl bio")
      .limit(50)
      .lean();
  },
};
