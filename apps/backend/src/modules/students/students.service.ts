import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import { Prisma, StudentStatus } from '@prisma/client';

export class StudentsService {
  async list(hostelId: string | undefined, query: {
    page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortOrder?: 'asc' | 'desc';
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: Prisma.StudentProfileWhereInput = {
      ...(hostelId && { user: { hostelId } }),
      ...(query.status && { status: query.status as StudentStatus }),
      ...(query.search && {
        OR: [
          { rollNumber: { contains: query.search, mode: 'insensitive' } },
          { user: { name: { contains: query.search, mode: 'insensitive' } } },
          { user: { email: { contains: query.search, mode: 'insensitive' } } },
        ],
      }),
    };

    const allowedSortFields = ['createdAt', 'updatedAt', 'rollNumber', 'department', 'year', 'status'] as const;
    const sortBy = allowedSortFields.includes(query.sortBy as any) ? query.sortBy! : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const [students, total] = await Promise.all([
      prisma.studentProfile.findMany({
        where,
        include: { user: { select: { id: true, email: true, name: true, phone: true, role: true, avatarUrl: true, isActive: true, hostelId: true, createdAt: true, updatedAt: true } }, bed: { include: { room: { include: { block: true } } } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.studentProfile.count({ where }),
    ]);

    return {
      students,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string) {
    const student = await prisma.studentProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, phone: true, role: true, avatarUrl: true, isActive: true, hostelId: true, createdAt: true, updatedAt: true } },
        bed: { include: { room: { include: { block: true } } } },
        feeRecords: { orderBy: { createdAt: 'desc' }, take: 5 },
        complaints: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!student) throw new AppError(404, 'Student not found');
    return student;
  }

  async apply(data: {
    email: string; password: string; name: string; phone?: string;
    rollNumber: string; department: string; year: number; gender: string;
    parentName: string; parentPhone: string; permanentAddress: string; hostelId: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError(409, 'Email already registered');

    const existingRoll = await prisma.studentProfile.findUnique({ where: { rollNumber: data.rollNumber } });
    if (existingRoll) throw new AppError(409, 'Roll number already registered');

    const hashed = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashed,
        name: data.name,
        phone: data.phone,
        role: 'STUDENT',
        hostelId: data.hostelId,
        studentProfile: {
          create: {
            rollNumber: data.rollNumber,
            department: data.department,
            year: data.year,
            gender: data.gender as any,
            parentName: data.parentName,
            parentPhone: data.parentPhone,
            permanentAddress: data.permanentAddress,
          },
        },
      },
      include: { studentProfile: true },
    });

    const { password: _, ...userData } = user;
    return userData;
  }

  async approve(id: string) {
    const student = await prisma.studentProfile.update({
      where: { id },
      data: { status: 'APPROVED', joinDate: new Date() },
    });
    return student;
  }

  async reject(id: string, reason?: string) {
    return prisma.studentProfile.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }

  async checkout(id: string) {
    return prisma.$transaction(async (tx) => {
      const student = await tx.studentProfile.findUnique({ where: { id } });
      if (!student) throw new AppError(404, 'Student not found');

      if (student.bedId) {
        await tx.bed.update({ where: { id: student.bedId }, data: { status: 'VACANT' } });
      }

      return tx.studentProfile.update({
        where: { id },
        data: { status: 'CHECKED_OUT', checkoutDate: new Date(), bedId: null },
      });
    });
  }

  async update(id: string, data: Partial<{
    department: string; year: number; parentName: string; parentPhone: string; permanentAddress: string;
  }>) {
    return prisma.studentProfile.update({ where: { id }, data });
  }

  async transfer(id: string, newBedId: string) {
    return prisma.$transaction(async (tx) => {
      const student = await tx.studentProfile.findUnique({ where: { id } });
      if (!student) throw new AppError(404, 'Student not found');
      if (student.status !== 'APPROVED') throw new AppError(400, 'Only approved students can be transferred');

      const newBed = await tx.bed.findUnique({ where: { id: newBedId }, include: { room: true } });
      if (!newBed) throw new AppError(404, 'Bed not found');
      if (newBed.status === 'OCCUPIED') throw new AppError(400, 'Target bed is already occupied');

      if (student.bedId) {
        await tx.bed.update({ where: { id: student.bedId }, data: { status: 'VACANT' } });
      }

      await tx.bed.update({ where: { id: newBedId }, data: { status: 'OCCUPIED' } });

      return tx.studentProfile.update({
        where: { id },
        data: { bedId: newBedId },
        include: { bed: { include: { room: { include: { block: true } } } } },
      });
    });
  }
}

export const studentsService = new StudentsService();
