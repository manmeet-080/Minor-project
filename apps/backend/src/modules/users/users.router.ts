import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { z } from 'zod';
import * as ctrl from './users.controller.js';

const router = Router();

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().min(10).optional(),
  role: z.enum(['ADMIN', 'WARDEN', 'STAFF']),
  hostelId: z.string().uuid(),
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  role: z.enum(['ADMIN', 'WARDEN', 'STAFF']).optional(),
  isActive: z.boolean().optional(),
});

router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'WARDEN'), ctrl.list);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(createSchema), ctrl.create);
router.patch('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(updateSchema), ctrl.update);
router.patch('/:id/deactivate', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), ctrl.deactivate);

export default router;
