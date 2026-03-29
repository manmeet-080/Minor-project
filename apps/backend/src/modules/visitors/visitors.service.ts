import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import { Prisma } from '@prisma/client';

export class VisitorsService {
  async list(query: { hostelId?: string; page?: number; limit?: number; search?: string; date?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: Prisma.VisitorWhereInput = {
      ...(query.hostelId && { hostelId: query.hostelId }),
      ...(query.search && {
        OR: [
          { visitorName: { contains: query.search, mode: 'insensitive' } },
          { visitorPhone: { contains: query.search } },
        ],
      }),
      ...(query.date && {
        entryTime: {
          gte: new Date(query.date),
          lt: new Date(new Date(query.date).getTime() + 86400000),
        },
      }),
    };

    const [visitors, total] = await Promise.all([
      prisma.visitor.findMany({
        where,
        include: {
          student: { include: { user: { select: { name: true } } } },
          loggedBy: { select: { name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { entryTime: 'desc' },
      }),
      prisma.visitor.count({ where }),
    ]);

    return { visitors, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async logEntry(data: {
    hostelId: string; visitorName: string; visitorPhone: string;
    purpose: string; studentId?: string; idProof: string; loggedById: string;
  }) {
    return prisma.visitor.create({ data });
  }

  async logExit(id: string) {
    const visitor = await prisma.visitor.findUnique({ where: { id } });
    if (!visitor) throw new AppError(404, 'Visitor not found');
    if (visitor.exitTime) throw new AppError(400, 'Exit already logged');
    return prisma.visitor.update({ where: { id }, data: { exitTime: new Date() } });
  }
}

export const visitorsService = new VisitorsService();
