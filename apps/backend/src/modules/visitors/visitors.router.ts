import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { z } from 'zod';
import * as ctrl from './visitors.controller.js';

const router = Router();

const entrySchema = z.object({
  hostelId: z.string().uuid(),
  visitorName: z.string().min(2),
  visitorPhone: z.string().min(10),
  purpose: z.string().min(3),
  studentId: z.string().uuid().optional(),
  idProof: z.string().min(3),
});

router.get('/', authenticate, ctrl.list);
router.post('/', authenticate, authorize('STAFF', 'ADMIN', 'WARDEN', 'SUPER_ADMIN'), validate(entrySchema), ctrl.logEntry);
router.patch('/:id/exit', authenticate, authorize('STAFF', 'ADMIN', 'WARDEN', 'SUPER_ADMIN'), ctrl.logExit);

export default router;
