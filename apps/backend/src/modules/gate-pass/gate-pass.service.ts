import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import { GatePassStatus, Prisma } from '@prisma/client';

export class GatePassService {
  async list(query: {
    hostelId?: string; studentId?: string; status?: string;
    page?: number; limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: Prisma.GatePassWhereInput = {
      ...(query.hostelId && { hostelId: query.hostelId }),
      ...(query.studentId && { studentId: query.studentId }),
      ...(query.status && { status: query.status as GatePassStatus }),
    };

    const [passes, total] = await Promise.all([
      prisma.gatePass.findMany({
        where,
        include: {
          student: { include: { user: { select: { name: true, email: true } } } },
          approvedBy: { select: { name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.gatePass.count({ where }),
    ]);

    return { passes, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async create(data: {
    studentId: string; hostelId: string; type: string;
    reason: string; destination: string; exitDate: string; expectedReturn: string;
  }) {
    return prisma.gatePass.create({
      data: {
        studentId: data.studentId,
        hostelId: data.hostelId,
        type: data.type as any,
        reason: data.reason,
        destination: data.destination,
        exitDate: new Date(data.exitDate),
        expectedReturn: new Date(data.expectedReturn),
      },
    });
  }

  async approve(id: string, approvedById: string, remarks?: string) {
    return prisma.gatePass.update({
      where: { id },
      data: { status: 'APPROVED', approvedById, remarks },
    });
  }

  async reject(id: string, approvedById: string, remarks?: string) {
    return prisma.gatePass.update({
      where: { id },
      data: { status: 'REJECTED', approvedById, remarks },
    });
  }

  async checkOut(id: string) {
    return prisma.gatePass.update({
      where: { id },
      data: { status: 'CHECKED_OUT' },
    });
  }

  async markReturned(id: string) {
    return prisma.gatePass.update({
      where: { id },
      data: { status: 'RETURNED', actualReturn: new Date() },
    });
  }
}

export const gatePassService = new GatePassService();
