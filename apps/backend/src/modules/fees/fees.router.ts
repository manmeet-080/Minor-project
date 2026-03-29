import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { z } from 'zod';
import * as ctrl from './fees.controller.js';

const router = Router();

const createSchema = z.object({
  studentId: z.string().uuid(),
  hostelId: z.string().uuid(),
  type: z.enum(['HOSTEL_FEE', 'MESS_FEE', 'MAINTENANCE_FEE', 'SECURITY_DEPOSIT', 'FINE', 'OTHER']),
  amount: z.number().positive(),
  dueDate: z.string(),
  remarks: z.string().optional(),
});

const paymentSchema = z.object({
  paidAmount: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE']),
  transactionId: z.string().optional(),
});

router.get('/', authenticate, ctrl.list);
router.get('/student/:studentId/balance', authenticate, ctrl.getStudentBalance);
router.get('/:id', authenticate, ctrl.getById);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(createSchema), ctrl.create);
router.patch('/:id/pay', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(paymentSchema), ctrl.recordPayment);
const waiveSchema = z.object({
  remarks: z.string().min(3),
});

router.patch('/:id/waive', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(waiveSchema), ctrl.waive);

export default router;
