import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { z } from 'zod';
import * as ctrl from './complaints.controller.js';
import { upload, uploadToCloudinary } from '../../shared/middleware/upload.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { success } from '../../shared/utils/apiResponse.js';

const router = Router();

const createSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  category: z.enum(['ELECTRICAL', 'PLUMBING', 'FURNITURE', 'CLEANING', 'INTERNET', 'PEST_CONTROL', 'SECURITY', 'MAINTENANCE', 'OTHER']),
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

// Image upload endpoint
router.post('/upload', authenticate, upload.array('images', 5), asyncHandler(async (req, res) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({ success: false, message: 'No files uploaded' });
    return;
  }
  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadToCloudinary(file.buffer, 'complaints');
    urls.push(url);
  }
  success(res, { urls }, 'Images uploaded', 201);
}));

export default router;
