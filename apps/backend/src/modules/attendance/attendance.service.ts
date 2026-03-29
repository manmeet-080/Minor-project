import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import { Prisma, AttendanceStatus } from '@prisma/client';

export class AttendanceService {
  async markAttendance(data: {
    studentId: string;
    hostelId: string;
    date: string;
    status: string;
    markedById: string;
    remarks?: string;
  }) {
    const dateObj = new Date(data.date);
    dateObj.setHours(0, 0, 0, 0);

    return prisma.attendance.upsert({
      where: { studentId_date: { studentId: data.studentId, date: dateObj } },
      update: {
        status: data.status as AttendanceStatus,
        remarks: data.remarks,
        markedById: data.markedById,
        ...(data.status === 'PRESENT' && !data.remarks ? { checkIn: new Date() } : {}),
      },
      create: {
        studentId: data.studentId,
        hostelId: data.hostelId,
        date: dateObj,
        status: data.status as AttendanceStatus,
        method: 'MANUAL',
        markedById: data.markedById,
        remarks: data.remarks,
        checkIn: data.status === 'PRESENT' ? new Date() : null,
      },
    });
  }

  async bulkMark(data: {
    studentIds: string[];
    hostelId: string;
    date: string;
    status: string;
    markedById: string;
  }) {
    const dateObj = new Date(data.date);
    dateObj.setHours(0, 0, 0, 0);

    const results = [];
    for (const studentId of data.studentIds) {
      const record = await this.markAttendance({
        studentId,
        hostelId: data.hostelId,
        date: data.date,
        status: data.status,
        markedById: data.markedById,
      });
      results.push(record);
    }
    return { marked: results.length };
  }

  async getByStudent(studentId: string, query: { month?: number; year?: number; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 31;
    const where: Prisma.AttendanceWhereInput = { studentId };

    if (query.month && query.year) {
      const start = new Date(query.year, query.month - 1, 1);
      const end = new Date(query.year, query.month, 0);
      where.date = { gte: start, lte: end };
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { markedBy: { select: { name: true, role: true } } },
      }),
      prisma.attendance.count({ where }),
    ]);

    const summary = {
      present: records.filter((r) => r.status === 'PRESENT').length,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      late: records.filter((r) => r.status === 'LATE').length,
      onLeave: records.filter((r) => r.status === 'ON_LEAVE').length,
    };

    return { records, summary, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getDailyReport(hostelId: string, date: string) {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const totalStudents = await prisma.studentProfile.count({
      where: { user: { hostelId }, status: 'APPROVED' },
    });

    const records = await prisma.attendance.findMany({
      where: { hostelId, date: dateObj },
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        markedBy: { select: { name: true } },
      },
    });

    return {
      date,
      totalStudents,
      marked: records.length,
      unmarked: totalStudents - records.length,
      present: records.filter((r) => r.status === 'PRESENT').length,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      late: records.filter((r) => r.status === 'LATE').length,
      onLeave: records.filter((r) => r.status === 'ON_LEAVE').length,
      records,
    };
  }
}

export const attendanceService = new AttendanceService();
