import { Request, Response } from 'express';
import { notificationsService } from './notifications.service.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { success } from '../../shared/utils/apiResponse.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationsService.list(req.user!.userId, {
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    unreadOnly: req.query.unreadOnly === 'true',
  });
  success(res, { notifications: result.notifications, unreadCount: result.unreadCount }, 'Notifications retrieved', 200, result.meta);
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationsService.markAsRead(req.params.id, req.user!.userId);
  success(res, null, 'Marked as read');
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationsService.markAllAsRead(req.user!.userId);
  success(res, null, 'All marked as read');
});

export const broadcast = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationsService.broadcast(req.body.hostelId, req.body.title, req.body.message);
  success(res, result, 'Broadcast sent');
});

export const sos = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationsService.sendSOS(req.user!.userId, req.user!.hostelId!);
  success(res, result, 'SOS alert sent');
});
