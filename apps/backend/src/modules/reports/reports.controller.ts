import { Request, Response } from 'express';
import { reportsService } from './reports.service.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { success } from '../../shared/utils/apiResponse.js';

export const occupancy = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportsService.occupancyReport(req.params.hostelId);
  success(res, report);
});

export const fees = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportsService.feeReport(req.params.hostelId, req.query.startDate as string, req.query.endDate as string);
  success(res, report);
});

export const complaints = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportsService.complaintReport(req.params.hostelId);
  success(res, report);
});

export const dashboard = asyncHandler(async (req: Request, res: Response) => {
  const stats = await reportsService.dashboardStats(req.params.hostelId);
  success(res, stats);
});

export const revenueTrend = asyncHandler(async (req: Request, res: Response) => {
  const trend = await reportsService.revenueTrend(req.params.hostelId, Number(req.query.months) || 6);
  success(res, trend);
});

export const gatePasses = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportsService.gatePassReport(req.params.hostelId);
  success(res, report);
});

export const visitors = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportsService.visitorReport(req.params.hostelId);
  success(res, report);
});

export const mess = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportsService.messReport(req.params.hostelId);
  success(res, report);
});

export const loginActivity = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportsService.loginActivityReport(req.params.hostelId);
  success(res, report);
});
