import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { z } from 'zod';
import * as ctrl from './hostels.controller.js';

const router = Router();

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().min(5).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional(),
  wardenId: z.string().uuid().optional(),
});

router.get('/', ctrl.list); // Public — needed for student registration form
router.get('/:id', authenticate, ctrl.getById);
router.patch('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(updateSchema), ctrl.update);

export default router;
