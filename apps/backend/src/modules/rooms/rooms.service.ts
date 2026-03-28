import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import { Prisma } from '@prisma/client';

export class RoomsService {
  async listRooms(query: { blockId?: string; status?: string; floor?: number; hostelId?: string; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const where: Prisma.RoomWhereInput = {
      ...(query.blockId && { blockId: query.blockId }),
      ...(query.status && { status: query.status as any }),
      ...(query.floor !== undefined && { floor: query.floor }),
      ...(query.hostelId && { block: { hostelId: query.hostelId } }),
    };

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        include: { block: true, beds: { include: { student: { include: { user: { select: { name: true, email: true } } } } } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { roomNumber: 'asc' },
      }),
      prisma.room.count({ where }),
    ]);

    return { rooms, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getRoom(id: string) {
    const room = await prisma.room.findUnique({
      where: { id },
      include: { block: true, beds: { include: { student: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } } } } },
    });
    if (!room) throw new AppError(404, 'Room not found');
    return room;
  }

  async createRoom(data: { roomNumber: string; blockId: string; floor: number; type: string; capacity: number; amenities?: string[] }) {
    const room = await prisma.room.create({
      data: {
        roomNumber: data.roomNumber,
        blockId: data.blockId,
        floor: data.floor,
        type: data.type as any,
        capacity: data.capacity,
        amenities: data.amenities || [],
      },
    });

    // Create beds for the room
    const beds = Array.from({ length: data.capacity }, (_, i) => ({
      bedNumber: `${data.roomNumber}-B${i + 1}`,
      roomId: room.id,
    }));
    await prisma.bed.createMany({ data: beds });

    return this.getRoom(room.id);
  }

  async updateRoom(id: string, data: Partial<{ type: string; capacity: number; status: string; amenities: string[] }>) {
    return prisma.room.update({ where: { id }, data: data as any });
  }

  async allocateBed(bedId: string, studentId: string) {
    const bed = await prisma.bed.findUnique({ where: { id: bedId }, include: { room: true } });
    if (!bed) throw new AppError(404, 'Bed not found');
    if (bed.status !== 'VACANT') throw new AppError(400, 'Bed is not available');

    await prisma.$transaction([
      prisma.bed.update({ where: { id: bedId }, data: { status: 'OCCUPIED' } }),
      prisma.studentProfile.update({ where: { id: studentId }, data: { bedId } }),
    ]);

    // Update room status
    await this.updateRoomStatus(bed.roomId);
    return this.getRoom(bed.roomId);
  }

  async vacateBed(bedId: string) {
    const bed = await prisma.bed.findUnique({ where: { id: bedId }, include: { student: true } });
    if (!bed) throw new AppError(404, 'Bed not found');

    await prisma.$transaction([
      prisma.bed.update({ where: { id: bedId }, data: { status: 'VACANT' } }),
      ...(bed.student ? [prisma.studentProfile.update({ where: { id: bed.student.id }, data: { bedId: null } })] : []),
    ]);

    await this.updateRoomStatus(bed.roomId);
  }

  async listBlocks(hostelId: string) {
    return prisma.block.findMany({
      where: { hostelId },
      include: { rooms: { select: { id: true, status: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createBlock(data: { name: string; hostelId: string; floors: number }) {
    return prisma.block.create({ data });
  }

  private async updateRoomStatus(roomId: string) {
    const beds = await prisma.bed.findMany({ where: { roomId } });
    const occupied = beds.filter((b) => b.status === 'OCCUPIED').length;
    const status = occupied === 0 ? 'AVAILABLE' : occupied === beds.length ? 'OCCUPIED' : 'PARTIALLY_OCCUPIED';
    await prisma.room.update({ where: { id: roomId }, data: { status: status as any } });
  }
}

export const roomsService = new RoomsService();
