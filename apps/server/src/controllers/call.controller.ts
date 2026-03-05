import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AuthRequest } from "../types/auth";
import { callService } from "../services/call.service";

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : (value ?? "");

export const createCall = async (req: AuthRequest, res: Response) => {
  const call = await callService.createCall(req.user!.userId, req.body);
  res
    .status(StatusCodes.CREATED)
    .json({ callId: call._id, participants: call.participants, call });
};

export const getCall = async (req: AuthRequest, res: Response) => {
  const call = await callService.getCall(req.user!.userId, getParam(req.params.callId));
  res.status(StatusCodes.OK).json({ call });
};

export const endCall = async (req: AuthRequest, res: Response) => {
  const call = await callService.endCall(req.user!.userId, getParam(req.params.callId));
  res.status(StatusCodes.OK).json({ call });
};
