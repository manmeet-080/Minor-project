import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { z } from 'zod';
import * as ctrl from './rooms.controller.js';

const router = Router();

const createRoomSchema = z.object({
  roomNumber: z.string().min(1),
  blockId: z.string().uuid(),
  floor: z.number().int().min(0),
  type: z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY']),
  capacity: z.number().int().min(1).max(20),
  amenities: z.array(z.string()).optional(),
});

const allocateSchema = z.object({
  bedId: z.string().uuid(),
  studentId: z.string().uuid(),
});

const createBlockSchema = z.object({
  name: z.string().min(1),
  hostelId: z.string().uuid(),
  floors: z.number().int().min(1),
});

router.get('/', authenticate, ctrl.listRooms);
router.get('/:id', authenticate, ctrl.getRoom);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(createRoomSchema), ctrl.createRoom);
router.patch('/:id', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), ctrl.updateRoom);
router.post('/allocate', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), validate(allocateSchema), ctrl.allocateBed);
router.post('/beds/:bedId/vacate', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), ctrl.vacateBed);
router.get('/blocks/:hostelId', authenticate, ctrl.listBlocks);
router.post('/blocks', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(createBlockSchema), ctrl.createBlock);

export default router;
