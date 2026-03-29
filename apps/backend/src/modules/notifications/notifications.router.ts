import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { z } from 'zod';
import * as ctrl from './notifications.controller.js';

const router = Router();

const broadcastSchema = z.object({
  hostelId: z.string().uuid(),
  title: z.string().min(2),
  message: z.string().min(5),
});

router.get('/', authenticate, ctrl.list);
router.patch('/:id/read', authenticate, ctrl.markAsRead);
router.patch('/read-all', authenticate, ctrl.markAllAsRead);
router.post('/broadcast', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), validate(broadcastSchema), ctrl.broadcast);
router.post('/sos', authenticate, ctrl.sos);

export default router;
