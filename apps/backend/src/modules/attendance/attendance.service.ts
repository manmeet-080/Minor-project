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

    const results = await Promise.all(
      data.studentIds.map((studentId) =>
        this.markAttendance({
          studentId,
          hostelId: data.hostelId,
          date: data.date,
          status: data.status,
          markedById: data.markedById,
        }),
      ),
    );
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
  async getSemesterSummary(hostelId: string, semester: 'odd' | 'even', year: number) {
    // Indian semesters: Odd = Jul-Dec, Even = Jan-Jun
    const start = semester === 'odd' ? new Date(year, 6, 1) : new Date(year, 0, 1);
    const end = semester === 'odd' ? new Date(year, 11, 31) : new Date(year, 5, 30);

    const records = await prisma.attendance.groupBy({
      by: ['status'],
      where: { hostelId, date: { gte: start, lte: end } },
      _count: true,
    });

    const totalMarked = records.reduce((s, r) => s + r._count, 0);
    const present = records.find((r) => r.status === 'PRESENT')?._count ?? 0;
    const absent = records.find((r) => r.status === 'ABSENT')?._count ?? 0;
    const late = records.find((r) => r.status === 'LATE')?._count ?? 0;
    const onLeave = records.find((r) => r.status === 'ON_LEAVE')?._count ?? 0;

    // Count working days (exclude Sundays) in the semester range up to today
    const today = new Date();
    const effectiveEnd = end > today ? today : end;
    let workingDays = 0;
    const d = new Date(start);
    while (d <= effectiveEnd) {
      if (d.getDay() !== 0) workingDays++; // Exclude Sundays
      d.setDate(d.getDate() + 1);
    }

    const totalStudents = await prisma.studentProfile.count({
      where: { user: { hostelId }, status: 'APPROVED' },
    });

    return {
      semester: semester === 'odd' ? `Odd Semester (Jul-Dec ${year})` : `Even Semester (Jan-Jun ${year})`,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      workingDays,
      totalStudents,
      totalMarked,
      present,
      absent,
      late,
      onLeave,
      attendanceRate: totalMarked > 0 ? Math.round(((present + late) / totalMarked) * 100) : 0,
    };
  }

  async updateAttendance(id: string, data: { status: string; remarks?: string; markedById: string }) {
    const record = await prisma.attendance.findUnique({ where: { id } });
    if (!record) throw new AppError(404, 'Attendance record not found');

    return prisma.attendance.update({
      where: { id },
      data: {
        status: data.status as AttendanceStatus,
        remarks: data.remarks,
        markedById: data.markedById,
        updatedAt: new Date(),
      },
    });
  }

  async getMonthCalendar(hostelId: string, month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const records = await prisma.attendance.findMany({
      where: { hostelId, date: { gte: start, lte: end } },
      include: {
        student: { include: { user: { select: { name: true } } } },
      },
      orderBy: [{ date: 'asc' }, { student: { user: { name: 'asc' } } }],
    });

    // Group by date
    const byDate: Record<string, { present: number; absent: number; late: number; onLeave: number; total: number }> = {};
    const daysInMonth = end.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month - 1, day).getDay();
      byDate[dateKey] = { present: 0, absent: 0, late: 0, onLeave: 0, total: 0 };
      if (dayOfWeek === 0) continue; // Skip Sundays in count
    }

    for (const r of records) {
      const dateKey = r.date.toISOString().split('T')[0];
      if (!byDate[dateKey]) byDate[dateKey] = { present: 0, absent: 0, late: 0, onLeave: 0, total: 0 };
      byDate[dateKey].total++;
      if (r.status === 'PRESENT') byDate[dateKey].present++;
      else if (r.status === 'ABSENT') byDate[dateKey].absent++;
      else if (r.status === 'LATE') byDate[dateKey].late++;
      else if (r.status === 'ON_LEAVE') byDate[dateKey].onLeave++;
    }

    return { month, year, calendar: byDate };
  }
}

export const attendanceService = new AttendanceService();
