import { Request, Response } from 'express';
import { studentsService } from './students.service.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { success } from '../../shared/utils/apiResponse.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await studentsService.list(req.user?.hostelId, {
    ...req.query as any,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  success(res, result.students, 'Students retrieved', 200, result.meta);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentsService.getById(req.params.id);
  success(res, student);
});

export const apply = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentsService.apply(req.body);
  success(res, student, 'Application submitted', 201);
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentsService.approve(req.params.id);
  success(res, student, 'Student approved');
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentsService.reject(req.params.id, req.body.reason);
  success(res, student, 'Student rejected');
});

export const checkout = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentsService.checkout(req.params.id);
  success(res, student, 'Student checked out');
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentsService.update(req.params.id, req.body);
  success(res, student, 'Student updated');
});

export const transfer = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentsService.transfer(req.params.id, req.body.newBedId);
  success(res, student, 'Student transferred');
});
