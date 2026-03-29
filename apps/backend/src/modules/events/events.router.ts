import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { z } from 'zod';
import * as ctrl from './events.controller.js';

const router = Router();

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  venue: z.string().min(2),
  date: z.string(),
  endDate: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional(),
  category: z.enum(['GENERAL', 'CULTURAL', 'SPORTS', 'ACADEMIC', 'FESTIVAL', 'MEETING']).optional(),
  hostelId: z.string().uuid(),
});

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  venue: z.string().min(2).optional(),
  date: z.string().optional(),
  endDate: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional(),
  category: z.enum(['GENERAL', 'CULTURAL', 'SPORTS', 'ACADEMIC', 'FESTIVAL', 'MEETING']).optional(),
});

const rsvpSchema = z.object({
  status: z.enum(['GOING', 'MAYBE', 'NOT_GOING']),
});

router.get('/', authenticate, ctrl.list);
router.get('/:id', authenticate, ctrl.getById);
router.post('/', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), validate(createSchema), ctrl.create);
router.patch('/:id', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), validate(updateSchema), ctrl.update);
router.delete('/:id', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), ctrl.remove);
router.post('/:id/rsvp', authenticate, validate(rsvpSchema), ctrl.rsvp);

export default router;
