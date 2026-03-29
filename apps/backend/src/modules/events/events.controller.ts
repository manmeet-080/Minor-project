import { Request, Response } from 'express';
import { eventsService } from './events.service.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { success } from '../../shared/utils/apiResponse.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await eventsService.list({
    hostelId: req.query.hostelId as string,
    category: req.query.category as string,
    upcoming: req.query.upcoming === 'true',
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  success(res, result.events, 'Events retrieved', 200, result.meta);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const event = await eventsService.getById(req.params.id, req.user?.userId);
  success(res, event);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const event = await eventsService.create({ ...req.body, createdById: req.user!.userId });
  success(res, event, 'Event created', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const event = await eventsService.update(req.params.id, req.body);
  success(res, event, 'Event updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await eventsService.remove(req.params.id);
  success(res, null, 'Event deleted');
});

export const rsvp = asyncHandler(async (req: Request, res: Response) => {
  const result = await eventsService.rsvp(req.params.id, req.user!.userId, req.body.status);
  success(res, result, 'RSVP updated');
});
