import { Request, Response } from 'express';
import { complaintsService } from './complaints.service.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { success } from '../../shared/utils/apiResponse.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await complaintsService.list({
    ...req.query as any,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  success(res, result.complaints, 'Complaints retrieved', 200, result.meta);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const complaint = await complaintsService.getById(req.params.id);
  success(res, complaint);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const complaint = await complaintsService.create(req.body);
  success(res, complaint, 'Complaint created', 201);
});

export const assign = asyncHandler(async (req: Request, res: Response) => {
  const complaint = await complaintsService.assign(req.params.id, req.body.assignedToId, req.user!.userId);
  success(res, complaint, 'Complaint assigned');
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const complaint = await complaintsService.updateStatus(
    req.params.id, req.body.status, req.body.message, req.user!.userId,
  );
  success(res, complaint, 'Complaint updated');
});
