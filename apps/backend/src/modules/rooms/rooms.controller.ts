import { Request, Response } from 'express';
import { roomsService } from './rooms.service.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { success } from '../../shared/utils/apiResponse.js';

export const listRooms = asyncHandler(async (req: Request, res: Response) => {
  const result = await roomsService.listRooms(req.query as any);
  success(res, result.rooms, 'Rooms retrieved', 200, result.meta);
});

export const getRoom = asyncHandler(async (req: Request, res: Response) => {
  const room = await roomsService.getRoom(req.params.id);
  success(res, room);
});

export const createRoom = asyncHandler(async (req: Request, res: Response) => {
  const room = await roomsService.createRoom(req.body);
  success(res, room, 'Room created', 201);
});

export const updateRoom = asyncHandler(async (req: Request, res: Response) => {
  const room = await roomsService.updateRoom(req.params.id, req.body);
  success(res, room, 'Room updated');
});

export const allocateBed = asyncHandler(async (req: Request, res: Response) => {
  const room = await roomsService.allocateBed(req.body.bedId, req.body.studentId);
  success(res, room, 'Bed allocated');
});

export const vacateBed = asyncHandler(async (req: Request, res: Response) => {
  await roomsService.vacateBed(req.params.bedId);
  success(res, null, 'Bed vacated');
});

export const listBlocks = asyncHandler(async (req: Request, res: Response) => {
  const blocks = await roomsService.listBlocks(req.params.hostelId);
  success(res, blocks);
});

export const createBlock = asyncHandler(async (req: Request, res: Response) => {
  const block = await roomsService.createBlock(req.body);
  success(res, block, 'Block created', 201);
});
