import { Request, Response } from 'express';
import { messService } from './mess.service.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { success } from '../../shared/utils/apiResponse.js';

export const getMenu = asyncHandler(async (req: Request, res: Response) => {
  const menu = await messService.getMenu(req.params.hostelId);
  success(res, menu);
});

export const updateMenu = asyncHandler(async (req: Request, res: Response) => {
  const { dayOfWeek, mealType, items } = req.body;
  const menu = await messService.updateMenu(req.params.hostelId, dayOfWeek, mealType, items);
  success(res, menu, 'Menu updated');
});

export const bookMeal = asyncHandler(async (req: Request, res: Response) => {
  const booking = await messService.bookMeal(req.body.studentId, req.body.hostelId, req.body.date, req.body.mealType);
  success(res, booking, 'Meal booked');
});

export const cancelMeal = asyncHandler(async (req: Request, res: Response) => {
  const booking = await messService.cancelMeal(req.body.studentId, req.body.date, req.body.mealType);
  success(res, booking, 'Meal cancelled');
});

export const submitFeedback = asyncHandler(async (req: Request, res: Response) => {
  const booking = await messService.submitFeedback(req.params.bookingId, req.body.feedback, req.body.rating);
  success(res, booking, 'Feedback submitted');
});

export const getBookings = asyncHandler(async (req: Request, res: Response) => {
  const bookings = await messService.getBookings(req.params.studentId, req.query.startDate as string, req.query.endDate as string);
  success(res, bookings);
});

export const getMonthlyReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await messService.getMonthlyReport(req.params.hostelId, Number(req.query.month), Number(req.query.year));
  success(res, report);
});

export const calculateFee = asyncHandler(async (req: Request, res: Response) => {
  const fee = await messService.calculateMonthlyFee(
    req.params.studentId,
    Number(req.query.month),
    Number(req.query.year),
    req.query.rate ? Number(req.query.rate) : undefined,
  );
  success(res, fee);
});
