import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { validate } from '../../shared/middleware/validate.js';
import { z } from 'zod';
import * as ctrl from './auth.controller.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

router.post('/login', validate(loginSchema), ctrl.login);
router.post('/refresh', validate(refreshSchema), ctrl.refresh);
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.getMe);
const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  avatarUrl: z.string().url().optional(),
});

router.patch('/me', authenticate, validate(updateProfileSchema), ctrl.updateProfile);
router.get('/sessions', authenticate, ctrl.getSessions);
router.post('/forgot-password', validate(forgotSchema), ctrl.forgotPassword);
router.post('/reset-password', validate(resetSchema), ctrl.resetPassword);
router.post('/change-password', authenticate, validate(changePasswordSchema), ctrl.changePassword);

export default router;
