import { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { success } from '../../shared/utils/apiResponse.js';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(
    email,
    password,
    req.ip || 'unknown',
    req.headers['user-agent'] || 'unknown',
  );
  success(res, result, 'Login successful');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshToken(refreshToken);
  success(res, tokens, 'Token refreshed');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || '';
  await authService.logout(req.user!.userId, token, req.body.refreshToken);
  success(res, null, 'Logged out successfully');
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.userId);
  success(res, user);
});

export const getSessions = asyncHandler(async (req: Request, res: Response) => {
  const sessions = await authService.getSessions(req.user!.userId);
  success(res, sessions);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  success(res, null, 'If the email exists, a reset link has been sent');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.password);
  success(res, null, 'Password reset successful');
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.updateProfile(req.user!.userId, req.body);
  success(res, user, 'Profile updated successfully');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.changePassword(req.user!.userId, req.body.currentPassword, req.body.newPassword);
  success(res, null, 'Password changed successfully');
});
