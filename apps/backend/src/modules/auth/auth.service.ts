import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database.js';
import { redis } from '../../config/redis.js';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import { JwtPayload } from '../../shared/middleware/authenticate.js';
import { v4 as uuid } from 'uuid';

export class AuthService {
  async login(email: string, password: string, ipAddress: string, userAgent: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { studentProfile: { include: { bed: { include: { room: { include: { block: true } } } } } } },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError(401, 'Invalid credentials');

    const tokens = this.generateTokens({
      userId: user.id,
      role: user.role,
      hostelId: user.hostelId ?? undefined,
    });

    // Store refresh token in Redis
    await redis.set(
      `rt:${user.id}:${tokens.refreshToken}`,
      '1',
      'EX',
      7 * 24 * 60 * 60,
    );

    // Log login
    await prisma.loginHistory.create({
      data: { userId: user.id, ipAddress, userAgent },
    });

    const { password: _, ...userData } = user;
    return { user: userData, ...tokens };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;

      // Check if refresh token exists in Redis
      const exists = await redis.get(`rt:${payload.userId}:${refreshToken}`);
      if (!exists) throw new AppError(401, 'Invalid refresh token');

      // Rotate: delete old, create new
      await redis.del(`rt:${payload.userId}:${refreshToken}`);

      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user || !user.isActive) throw new AppError(401, 'User not found or inactive');

      const tokens = this.generateTokens({
        userId: user.id,
        role: user.role,
        hostelId: user.hostelId ?? undefined,
      });

      await redis.set(
        `rt:${user.id}:${tokens.refreshToken}`,
        '1',
        'EX',
        7 * 24 * 60 * 60,
      );

      return tokens;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(401, 'Invalid refresh token');
    }
  }

  async logout(userId: string, accessToken: string, refreshToken?: string) {
    // Blacklist access token
    const decoded = jwt.decode(accessToken) as { exp?: number };
    if (decoded?.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) await redis.set(`bl:${accessToken}`, '1', 'EX', ttl);
    }

    // Remove refresh token
    if (refreshToken) {
      await redis.del(`rt:${userId}:${refreshToken}`);
    }
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: { include: { bed: { include: { room: { include: { block: true } } } } } } },
    });
    if (!user) throw new AppError(404, 'User not found');
    const { password: _, ...userData } = user;
    return userData;
  }

  async getSessions(userId: string) {
    return prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      phone?: string;
      department?: string;
      year?: number;
      parentName?: string;
      parentPhone?: string;
      permanentAddress?: string;
    },
  ) {
    const { department, year, parentName, parentPhone, permanentAddress, ...userData } = data;

    const user = await prisma.user.update({
      where: { id: userId },
      data: userData,
      include: { studentProfile: true },
    });

    const studentFields = { department, year, parentName, parentPhone, permanentAddress };
    const hasStudentFields = Object.values(studentFields).some((v) => v !== undefined);

    if (hasStudentFields && user.studentProfile) {
      await prisma.studentProfile.update({
        where: { userId },
        data: Object.fromEntries(Object.entries(studentFields).filter(([_, v]) => v !== undefined)),
      });
    }

    const updated = await prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true },
    });
    const { password: _, ...result } = updated!;
    return result;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User not found');

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new AppError(400, 'Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Don't reveal if email exists

    const resetToken = uuid();
    await redis.set(`pwd-reset:${resetToken}`, user.id, 'EX', 60 * 30); // 30 min
    // TODO: Send email with reset link
    return resetToken; // In production, don't return this
  }

  async resetPassword(token: string, newPassword: string) {
    const userId = await redis.get(`pwd-reset:${token}`);
    if (!userId) throw new AppError(400, 'Invalid or expired reset token');

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    await redis.del(`pwd-reset:${token}`);
  }

  private generateTokens(payload: JwtPayload) {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY as unknown as number });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY as unknown as number });
    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
