import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env";
import { AuthRequest } from "../types/auth";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { authService } from "../services/auth.service";
import { AppError } from "../utils/AppError";

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.COOKIE_SECURE,
  path: "/api/v1/auth"
};

export const register = async (req: AuthRequest, res: Response) => {
  const { user, payload } = await authService.register(req.body);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.cookie(env.COOKIE_NAME, refreshToken, refreshCookieOptions);
  res.status(StatusCodes.CREATED).json({
    accessToken,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio
    }
  });
};

export const login = async (req: AuthRequest, res: Response) => {
  const { user, payload } = await authService.login(req.body);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.cookie(env.COOKIE_NAME, refreshToken, refreshCookieOptions);
  res.status(StatusCodes.OK).json({
    accessToken,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio
    }
  });
};

export const logout = async (_req: AuthRequest, res: Response) => {
  res.clearCookie(env.COOKIE_NAME, refreshCookieOptions);
  res.status(StatusCodes.OK).json({ message: "Logged out" });
};

export const refresh = async (req: AuthRequest, res: Response) => {
  const token = req.cookies?.[env.COOKIE_NAME] as string | undefined;
  if (!token) {
    throw new AppError("Missing refresh token", StatusCodes.UNAUTHORIZED);
  }

  const payload = verifyRefreshToken(token);
  const user = await authService.me(payload.userId);

  const nextPayload = { userId: user._id.toString(), email: user.email };
  const accessToken = signAccessToken(nextPayload);
  const refreshToken = signRefreshToken(nextPayload);

  res.cookie(env.COOKIE_NAME, refreshToken, refreshCookieOptions);
  res.status(StatusCodes.OK).json({ accessToken });
};

export const me = async (req: AuthRequest, res: Response) => {
  const user = await authService.me(req.user!.userId);
  res.status(StatusCodes.OK).json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio
    }
  });
};