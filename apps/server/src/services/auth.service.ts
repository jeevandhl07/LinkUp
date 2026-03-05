import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import { UserModel } from "../models/User";
import { AppError } from "../utils/AppError";
import { JwtPayload } from "../types/auth";

export const authService = {
  async register(input: { email: string; name: string; password: string }) {
    const existing = await UserModel.findOne({
      email: input.email.toLowerCase(),
    });
    if (existing) {
      throw new AppError("Email already registered", StatusCodes.CONFLICT);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await UserModel.create({
      email: input.email,
      name: input.name,
      passwordHash,
    });

    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
    };
    return { user, payload };
  },

  async login(input: { email: string; password: string }) {
    const user = await UserModel.findOne({ email: input.email.toLowerCase() });
    if (!user) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
    }

    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
    };
    return { user, payload };
  },

  async me(userId: string) {
    const user = await UserModel.findById(userId).select("-passwordHash");
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }
    return user;
  },
};
