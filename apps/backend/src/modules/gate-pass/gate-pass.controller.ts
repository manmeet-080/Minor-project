import { Request, Response } from 'express';
import { gatePassService } from './gate-pass.service.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { success } from '../../shared/utils/apiResponse.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await gatePassService.list(req.query as any);
  success(res, result.passes, 'Gate passes retrieved', 200, result.meta);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const pass = await gatePassService.create(req.body);
  success(res, pass, 'Gate pass requested', 201);
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const pass = await gatePassService.approve(req.params.id, req.user!.userId, req.body.remarks);
  success(res, pass, 'Gate pass approved');
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const pass = await gatePassService.reject(req.params.id, req.user!.userId, req.body.remarks);
  success(res, pass, 'Gate pass rejected');
});

export const checkOut = asyncHandler(async (req: Request, res: Response) => {
  const pass = await gatePassService.checkOut(req.params.id);
  success(res, pass, 'Checked out');
});

export const markReturned = asyncHandler(async (req: Request, res: Response) => {
  const pass = await gatePassService.markReturned(req.params.id);
  success(res, pass, 'Marked as returned');
});
