import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { z } from 'zod';
import * as ctrl from './students.controller.js';

const router = Router();

const applySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
  rollNumber: z.string().min(1),
  department: z.string().min(1),
  year: z.number().int().min(1).max(6),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  parentName: z.string().min(2),
  parentPhone: z.string().min(10),
  permanentAddress: z.string().min(5),
  hostelId: z.string().uuid(),
});

const updateSchema = z.object({
  department: z.string().min(1).optional(),
  year: z.number().int().min(1).max(6).optional(),
  parentName: z.string().min(2).optional(),
  parentPhone: z.string().min(10).optional(),
  permanentAddress: z.string().min(5).optional(),
});

const rejectSchema = z.object({
  reason: z.string().min(3).optional(),
});

router.post('/apply', validate(applySchema), ctrl.apply);
router.get('/', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), ctrl.list);
router.get('/:id', authenticate, ctrl.getById);
router.patch('/:id', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), validate(updateSchema), ctrl.update);
router.post('/:id/approve', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), ctrl.approve);
router.post('/:id/reject', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), validate(rejectSchema), ctrl.reject);
router.post('/:id/checkout', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), ctrl.checkout);

const transferSchema = z.object({
  newBedId: z.string().uuid(),
});

router.post('/:id/transfer', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), validate(transferSchema), ctrl.transfer);

export default router;
