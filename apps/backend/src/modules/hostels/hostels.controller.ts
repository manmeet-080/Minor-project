import { Request, Response } from 'express';
import { hostelsService } from './hostels.service.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { success } from '../../shared/utils/apiResponse.js';

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const hostels = await hostelsService.list();
  success(res, hostels, 'Hostels retrieved');
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const hostel = await hostelsService.getById(req.params.id);
  success(res, hostel);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const hostel = await hostelsService.update(req.params.id, req.body);
  success(res, hostel, 'Hostel updated successfully');
});
