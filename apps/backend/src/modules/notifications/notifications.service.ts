import { prisma } from '../../config/database.js';
import { NotificationType } from '@prisma/client';
import { events } from '../../sockets/events.js';

export class NotificationsService {
  async list(userId: string, query: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where = {
      userId,
      ...(query.unreadOnly && { isRead: false }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      unreadCount,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async create(userId: string, title: string, message: string, type: NotificationType = 'INFO', link?: string) {
    return prisma.notification.create({
      data: { userId, title, message, type, link },
    });
  }

  async broadcast(hostelId: string, title: string, message: string) {
    const users = await prisma.user.findMany({
      where: { hostelId, isActive: true },
      select: { id: true },
    });

    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        title,
        message,
        type: 'ANNOUNCEMENT' as NotificationType,
      })),
    });

    events.broadcastNotification(hostelId, { title, message });
    return { sent: users.length };
  }
}

export const notificationsService = new NotificationsService();
