import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/middleware/errorHandler.js';

export class HostelsService {
  async list() {
    return prisma.hostel.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true, gender: true },
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: string) {
    const hostel = await prisma.hostel.findUnique({
      where: { id },
      include: {
        warden: { select: { id: true, name: true, email: true, phone: true } },
        blocks: { include: { _count: { select: { rooms: true } } } },
        _count: { select: { users: true, complaints: true } },
      },
    });
    if (!hostel) throw new AppError(404, 'Hostel not found');
    return hostel;
  }

  async update(id: string, data: { name?: string; address?: string; code?: string; gender?: string }) {
    const hostel = await prisma.hostel.findUnique({ where: { id } });
    if (!hostel) throw new AppError(404, 'Hostel not found');

    return prisma.hostel.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.address && { address: data.address }),
        ...(data.code && { code: data.code }),
        ...(data.gender && { gender: data.gender as any }),
      },
    });
  }
}

export const hostelsService = new HostelsService();
