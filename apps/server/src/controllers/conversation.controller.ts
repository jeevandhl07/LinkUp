import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AuthRequest } from "../types/auth";
import { conversationService } from "../services/conversation.service";

export const createDirect = async (req: AuthRequest, res: Response) => {
  const conversation = await conversationService.createOrGetDirect(req.user!.userId, req.body.userId);
  res.status(StatusCodes.OK).json({ conversation });
};

export const createGroup = async (req: AuthRequest, res: Response) => {
  const conversation = await conversationService.createGroup(req.user!.userId, req.body);
  res.status(StatusCodes.CREATED).json({ conversation });
};

export const listConversations = async (req: AuthRequest, res: Response) => {
  const conversations = await conversationService.listMyConversations(req.user!.userId);
  res.status(StatusCodes.OK).json({ conversations });
};

export const getConversation = async (req: AuthRequest, res: Response) => {
  const conversation = await conversationService.getConversation(req.user!.userId, req.params.id);
  res.status(StatusCodes.OK).json({ conversation });
};

export const updateConversation = async (req: AuthRequest, res: Response) => {
  const conversation = await conversationService.updateConversation(req.user!.userId, req.params.id, req.body);
  res.status(StatusCodes.OK).json({ conversation });
};

export const addMembers = async (req: AuthRequest, res: Response) => {
  const conversation = await conversationService.addMembers(req.user!.userId, req.params.id, req.body.memberIds);
  res.status(StatusCodes.OK).json({ conversation });
};

export const removeMember = async (req: AuthRequest, res: Response) => {
  const conversation = await conversationService.removeMember(req.user!.userId, req.params.id, req.params.userId);
  res.status(StatusCodes.OK).json({ conversation });
};

export const leaveConversation = async (req: AuthRequest, res: Response) => {
  const result = await conversationService.leaveConversation(req.user!.userId, req.params.id);
  res.status(StatusCodes.OK).json(result);
};

export const readConversation = async (req: AuthRequest, res: Response) => {
  const conversation = await conversationService.updateRead(req.user!.userId, req.params.id, req.body.lastReadMessageId);
  res.status(StatusCodes.OK).json({ conversation });
};