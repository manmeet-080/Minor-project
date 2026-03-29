import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { z } from 'zod';
import * as ctrl from './attendance.controller.js';

const router = Router();

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format');

const markSchema = z.object({
  studentId: z.string().uuid(),
  hostelId: z.string().uuid(),
  date: dateString,
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE']),
  remarks: z.string().optional(),
});

const bulkMarkSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1),
  hostelId: z.string().uuid(),
  date: dateString,
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE']),
});

const updateSchema = z.object({
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE']),
  remarks: z.string().optional(),
});

router.post('/', authenticate, authorize('STAFF', 'ADMIN', 'WARDEN', 'SUPER_ADMIN'), validate(markSchema), ctrl.mark);
router.post('/bulk', authenticate, authorize('STAFF', 'ADMIN', 'WARDEN', 'SUPER_ADMIN'), validate(bulkMarkSchema), ctrl.bulkMark);
router.patch('/:id', authenticate, authorize('STAFF', 'ADMIN', 'WARDEN', 'SUPER_ADMIN'), validate(updateSchema), ctrl.update);
router.get('/student/:studentId', authenticate, ctrl.getByStudent);
router.get('/daily/:hostelId', authenticate, authorize('STAFF', 'ADMIN', 'WARDEN', 'SUPER_ADMIN'), ctrl.dailyReport);
router.get('/semester/:hostelId', authenticate, authorize('STAFF', 'ADMIN', 'WARDEN', 'SUPER_ADMIN'), ctrl.semesterSummary);
router.get('/calendar/:hostelId', authenticate, authorize('STAFF', 'ADMIN', 'WARDEN', 'SUPER_ADMIN'), ctrl.monthCalendar);

export default router;
