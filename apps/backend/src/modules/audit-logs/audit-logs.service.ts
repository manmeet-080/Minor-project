import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';

export class AuditLogsService {
  async list(query: {
    hostelId?: string;
    userId?: string;
    entity?: string;
    action?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 30;
    const where: Prisma.AuditLogWhereInput = {
      ...(query.userId && { userId: query.userId }),
      ...(query.entity && { entity: query.entity }),
      ...(query.action && { action: { contains: query.action, mode: 'insensitive' } }),
      ...(query.hostelId && { user: { hostelId: query.hostelId } }),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, role: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}

export const auditLogsService = new AuditLogsService();
