import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AuthRequest } from "../types/auth";
import { messageService } from "../services/message.service";

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : (value ?? "");

export const listMessages = async (req: AuthRequest, res: Response) => {
  const data = await messageService.listMessages(
    req.user!.userId,
    getParam(req.params.id),
    req.query.cursor as string | undefined,
    Number(req.query.limit || 20),
  );
  res.status(StatusCodes.OK).json(data);
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  const message = await messageService.sendMessage(
    req.user!.userId,
    getParam(req.params.id),
    req.body.content,
  );
  res.status(StatusCodes.CREATED).json({ message });
};

export const reactMessage = async (req: AuthRequest, res: Response) => {
  const message = await messageService.addReaction(
    req.user!.userId,
    getParam(req.params.messageId),
    req.body.emoji,
  );
  res.status(StatusCodes.OK).json({ message });
};
