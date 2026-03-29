import { Request, Response } from 'express';
import { feesService } from './fees.service.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { success } from '../../shared/utils/apiResponse.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await feesService.list({
    ...req.query as any,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  success(res, result.fees, 'Fees retrieved', 200, result.meta);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const fee = await feesService.getById(req.params.id);
  success(res, fee);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const fee = await feesService.create(req.body);
  success(res, fee, 'Fee record created', 201);
});

export const recordPayment = asyncHandler(async (req: Request, res: Response) => {
  const fee = await feesService.recordPayment(req.params.id, req.body);
  success(res, fee, 'Payment recorded');
});

export const waive = asyncHandler(async (req: Request, res: Response) => {
  const fee = await feesService.waive(req.params.id, req.body.remarks);
  success(res, fee, 'Fee waived');
});

export const getStudentBalance = asyncHandler(async (req: Request, res: Response) => {
  const balance = await feesService.getStudentBalance(req.params.studentId);
  success(res, balance);
});

export const getReceipt = asyncHandler(async (req: Request, res: Response) => {
  const html = await feesService.generateReceipt(req.params.id);
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `inline; filename="receipt-${req.params.id.slice(0, 8)}.html"`);
  res.send(html);
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await feesService.createPaymentOrder(req.params.id);
  success(res, order, 'Payment order created');
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const fee = await feesService.verifyPayment(req.params.id, req.body);
  success(res, fee, 'Payment verified and recorded');
});
