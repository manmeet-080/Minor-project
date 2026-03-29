import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import { Prisma, ComplaintStatus } from '@prisma/client';
import { events } from '../../sockets/events.js';

export class ComplaintsService {
  async list(query: {
    hostelId?: string; status?: string; studentId?: string; assignedToId?: string;
    category?: string; priority?: string; page?: number; limit?: number; search?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: Prisma.ComplaintWhereInput = {
      deletedAt: null,
      ...(query.hostelId && { hostelId: query.hostelId }),
      ...(query.status && { status: query.status as ComplaintStatus }),
      ...(query.studentId && { studentId: query.studentId }),
      ...(query.assignedToId && { assignedToId: query.assignedToId }),
      ...(query.category && { category: query.category as any }),
      ...(query.priority && { priority: query.priority as any }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          student: { include: { user: { select: { name: true, email: true } } } },
          assignedTo: { select: { id: true, name: true, role: true } },
          room: { select: { roomNumber: true } },
          _count: { select: { updates: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.complaint.count({ where }),
    ]);

    return { complaints, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string) {
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        student: { include: { user: { select: { name: true, email: true, phone: true } } } },
        assignedTo: { select: { id: true, name: true, role: true } },
        room: { select: { roomNumber: true, block: { select: { name: true } } } },
        updates: { include: { user: { select: { name: true, role: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!complaint) throw new AppError(404, 'Complaint not found');
    return complaint;
  }

  async create(data: {
    title: string; description: string; category: string; priority?: string;
    images?: string[]; studentId: string; hostelId: string; roomId?: string;
  }) {
    const complaint = await prisma.complaint.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category as any,
        priority: (data.priority as any) || 'MEDIUM',
        images: data.images || [],
        studentId: data.studentId,
        hostelId: data.hostelId,
        roomId: data.roomId,
      },
      include: { student: { include: { user: { select: { name: true } } } } },
    });

    events.newComplaint(data.hostelId, { id: complaint.id, title: data.title, category: data.category, priority: (data.priority as string) || 'MEDIUM' });
    return complaint;
  }

  async assign(id: string, assignedToId: string, userId: string) {
    const complaint = await prisma.complaint.update({
      where: { id },
      data: { assignedToId, status: 'ASSIGNED' },
    });

    await prisma.complaintUpdate.create({
      data: { complaintId: id, userId, message: 'Complaint assigned to staff', status: 'ASSIGNED' },
    });

    return complaint;
  }

  async updateStatus(id: string, status: ComplaintStatus, message: string, userId: string) {
    const data: any = { status };
    if (status === 'RESOLVED') data.resolvedAt = new Date();

    const complaint = await prisma.complaint.update({
      where: { id },
      data,
      include: { student: { include: { user: { select: { id: true } } } } },
    });

    await prisma.complaintUpdate.create({
      data: { complaintId: id, userId, message, status },
    });

    if (complaint.student?.user?.id) {
      events.complaintStatusChanged(complaint.student.user.id, complaint.hostelId, { id, title: complaint.title, status });
    }

    return this.getById(id);
  }
}

export const complaintsService = new ComplaintsService();
