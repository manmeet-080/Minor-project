import { Request, Response } from 'express';
import { visitorsService } from './visitors.service.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { success } from '../../shared/utils/apiResponse.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await visitorsService.list({
    ...req.query as any,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  success(res, result.visitors, 'Visitors retrieved', 200, result.meta);
});

export const logEntry = asyncHandler(async (req: Request, res: Response) => {
  const visitor = await visitorsService.logEntry({ ...req.body, loggedById: req.user!.userId });
  success(res, visitor, 'Visitor entry logged', 201);
});

export const logExit = asyncHandler(async (req: Request, res: Response) => {
  const visitor = await visitorsService.logExit(req.params.id);
  success(res, visitor, 'Visitor exit logged');
});
