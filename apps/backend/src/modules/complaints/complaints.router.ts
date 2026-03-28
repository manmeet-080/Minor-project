import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { z } from 'zod';
import * as ctrl from './complaints.controller.js';

const router = Router();

const createSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  category: z.enum(['ELECTRICAL', 'PLUMBING', 'FURNITURE', 'CLEANING', 'INTERNET', 'PEST_CONTROL', 'SECURITY', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  images: z.array(z.string()).optional(),
  studentId: z.string().uuid(),
  hostelId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
});

const assignSchema = z.object({ assignedToId: z.string().uuid() });

const updateStatusSchema = z.object({
  status: z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED']),
  message: z.string().min(1),
});

router.get('/', authenticate, ctrl.list);
router.get('/:id', authenticate, ctrl.getById);
router.post('/', authenticate, validate(createSchema), ctrl.create);
router.patch('/:id/assign', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), validate(assignSchema), ctrl.assign);
router.patch('/:id/status', authenticate, validate(updateStatusSchema), ctrl.updateStatus);

export default router;
