import { Request, Response } from 'express';
import { usersService } from './users.service.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { success } from '../../shared/utils/apiResponse.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await usersService.list({
    hostelId: req.query.hostelId as string,
    role: req.query.role as string,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  success(res, result.users, 'Success', 200, result.meta);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.create(req.body);
  success(res, user, 'User created', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.update(req.params.id, req.body);
  success(res, user, 'User updated');
});

export const deactivate = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.deactivate(req.params.id);
  success(res, user, 'User deactivated');
});
