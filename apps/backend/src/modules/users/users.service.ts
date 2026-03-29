import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
import { AppError } from '../../shared/middleware/errorHandler.js';

export class UsersService {
  async list(query: {
    hostelId?: string;
    role?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.hostelId && { hostelId: query.hostelId }),
      ...(query.role && { role: query.role as any }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          avatarUrl: true,
          isActive: true,
          hostelId: true,
          createdAt: true,
          updatedAt: true,
          studentProfile: {
            select: {
              id: true,
              rollNumber: true,
              department: true,
              year: true,
              status: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
  async create(data: { email: string; password: string; name: string; phone?: string; role: string; hostelId: string }) {
    const bcrypt = await import('bcryptjs');
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError(409, 'Email already registered');

    const hashed = await bcrypt.default.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { ...data, password: hashed, role: data.role as any },
      select: { id: true, email: true, name: true, phone: true, role: true, isActive: true, hostelId: true, createdAt: true },
    });
    return user;
  }

  async update(id: string, data: { name?: string; phone?: string; role?: string; isActive?: boolean }) {
    return prisma.user.update({
      where: { id },
      data: { ...data, ...(data.role && { role: data.role as any }) },
      select: { id: true, email: true, name: true, phone: true, role: true, isActive: true, hostelId: true, updatedAt: true },
    });
  }

  async deactivate(id: string) {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true, name: true, isActive: true },
    });
  }
}

export const usersService = new UsersService();
