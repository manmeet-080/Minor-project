import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import { Prisma, EventCategory, RsvpStatus } from '@prisma/client';

export class EventsService {
  async list(query: {
    hostelId?: string;
    category?: string;
    upcoming?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: Prisma.EventWhereInput = {
      isActive: true,
      ...(query.hostelId && { hostelId: query.hostelId }),
      ...(query.category && { category: query.category as EventCategory }),
      ...(query.upcoming && { date: { gte: new Date() } }),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          createdBy: { select: { name: true } },
          _count: { select: { rsvps: true } },
          rsvps: { where: { status: 'GOING' }, select: { id: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'asc' },
      }),
      prisma.event.count({ where }),
    ]);

    const eventsWithCount = events.map((e) => ({
      ...e,
      goingCount: e.rsvps.length,
      rsvps: undefined,
    }));

    return { events: eventsWithCount, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string, userId?: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { rsvps: true } },
        rsvps: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!event) throw new AppError(404, 'Event not found');

    const userRsvp = userId ? event.rsvps.find((r) => r.userId === userId) : null;
    const goingCount = event.rsvps.filter((r) => r.status === 'GOING').length;
    const maybeCount = event.rsvps.filter((r) => r.status === 'MAYBE').length;

    return { ...event, goingCount, maybeCount, userRsvp: userRsvp?.status || null };
  }

  async create(data: {
    title: string; description: string; venue: string;
    date: string; endDate?: string; capacity?: number;
    imageUrl?: string; category?: string;
    hostelId: string; createdById: string;
  }) {
    return prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        venue: data.venue,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : null,
        capacity: data.capacity,
        imageUrl: data.imageUrl,
        category: (data.category as EventCategory) || 'GENERAL',
        hostelId: data.hostelId,
        createdById: data.createdById,
      },
    });
  }

  async update(id: string, data: Partial<{
    title: string; description: string; venue: string;
    date: string; endDate: string; capacity: number;
    imageUrl: string; category: string; isActive: boolean;
  }>) {
    const updateData: any = { ...data };
    if (data.date) updateData.date = new Date(data.date);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.category) updateData.category = data.category as EventCategory;

    return prisma.event.update({ where: { id }, data: updateData });
  }

  async remove(id: string) {
    return prisma.event.update({ where: { id }, data: { isActive: false } });
  }

  async rsvp(eventId: string, userId: string, status: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new AppError(404, 'Event not found');

    if (status === 'NOT_GOING') {
      await prisma.eventRsvp.deleteMany({ where: { eventId, userId } });
      return { status: 'removed' };
    }

    return prisma.eventRsvp.upsert({
      where: { eventId_userId: { eventId, userId } },
      update: { status: status as RsvpStatus },
      create: { eventId, userId, status: status as RsvpStatus },
    });
  }
}

export const eventsService = new EventsService();
