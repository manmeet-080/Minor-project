import { Request, Response } from 'express';
import { auditLogsService } from './audit-logs.service.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { success } from '../../shared/utils/apiResponse.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await auditLogsService.list({
    hostelId: req.query.hostelId as string,
    userId: req.query.userId as string,
    entity: req.query.entity as string,
    action: req.query.action as string,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  success(res, result.logs, 'Audit logs retrieved', 200, result.meta);
});
