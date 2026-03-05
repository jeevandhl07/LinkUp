import { Request } from "express";

export type JwtPayload = {
  userId: string;
  email: string;
};

export type AuthRequest = Request & {
  user?: JwtPayload;
};
