import { Request, Response } from 'express';
import { attendanceService } from './attendance.service.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { success } from '../../shared/utils/apiResponse.js';

export const mark = asyncHandler(async (req: Request, res: Response) => {
  const record = await attendanceService.markAttendance({
    ...req.body,
    markedById: req.user!.userId,
  });
  success(res, record, 'Attendance marked', 201);
});

export const bulkMark = asyncHandler(async (req: Request, res: Response) => {
  const result = await attendanceService.bulkMark({
    ...req.body,
    markedById: req.user!.userId,
  });
  success(res, result, 'Bulk attendance marked');
});

export const getByStudent = asyncHandler(async (req: Request, res: Response) => {
  const result = await attendanceService.getByStudent(req.params.studentId, {
    month: req.query.month ? Number(req.query.month) : undefined,
    year: req.query.year ? Number(req.query.year) : undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  success(res, result, 'Attendance retrieved');
});

export const dailyReport = asyncHandler(async (req: Request, res: Response) => {
  const result = await attendanceService.getDailyReport(
    req.params.hostelId,
    req.query.date as string || new Date().toISOString().split('T')[0],
  );
  success(res, result, 'Daily report retrieved');
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const record = await attendanceService.updateAttendance(req.params.id, {
    ...req.body,
    markedById: req.user!.userId,
  });
  success(res, record, 'Attendance updated');
});

export const semesterSummary = asyncHandler(async (req: Request, res: Response) => {
  const semester = (req.query.semester as string) === 'even' ? 'even' : 'odd';
  const year = Number(req.query.year) || new Date().getFullYear();
  const result = await attendanceService.getSemesterSummary(req.params.hostelId, semester, year);
  success(res, result, 'Semester summary retrieved');
});

export const monthCalendar = asyncHandler(async (req: Request, res: Response) => {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const result = await attendanceService.getMonthCalendar(req.params.hostelId, month, year);
  success(res, result, 'Calendar retrieved');
});
