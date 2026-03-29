import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { z } from 'zod';
import * as ctrl from './gate-pass.controller.js';

const router = Router();

const createSchema = z.object({
  studentId: z.string().uuid(),
  hostelId: z.string().uuid(),
  type: z.enum(['LOCAL', 'HOME', 'EMERGENCY', 'MEDICAL']),
  reason: z.string().min(5),
  destination: z.string().min(2),
  exitDate: z.string(),
  expectedReturn: z.string(),
});

router.get('/', authenticate, ctrl.list);
router.post('/', authenticate, validate(createSchema), ctrl.create);
const remarksSchema = z.object({
  remarks: z.string().optional(),
});

router.patch('/:id/approve', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), validate(remarksSchema), ctrl.approve);
router.patch('/:id/reject', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), validate(remarksSchema), ctrl.reject);
router.patch('/:id/checkout', authenticate, ctrl.checkOut);
router.patch('/:id/return', authenticate, ctrl.markReturned);

export default router;
