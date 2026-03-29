import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';

export class ReportsService {
  async occupancyReport(hostelId: string) {
    // Use groupBy for room status counts instead of loading all rooms
    const [roomStats, bedStats] = await Promise.all([
      prisma.room.groupBy({
        by: ['status'],
        where: { block: { hostelId } },
        _count: true,
      }),
      prisma.bed.groupBy({
        by: ['status'],
        where: { room: { block: { hostelId } } },
        _count: true,
      }),
    ]);

    const totalRooms = roomStats.reduce((s, r) => s + r._count, 0);
    const totalBeds = bedStats.reduce((s, b) => s + b._count, 0);
    const occupiedBeds = bedStats.find((b) => b.status === 'OCCUPIED')?._count ?? 0;

    const byStatus = {
      available: roomStats.find((r) => r.status === 'AVAILABLE')?._count ?? 0,
      occupied: roomStats.find((r) => r.status === 'OCCUPIED')?._count ?? 0,
      partiallyOccupied: roomStats.find((r) => r.status === 'PARTIALLY_OCCUPIED')?._count ?? 0,
      underMaintenance: roomStats.find((r) => r.status === 'UNDER_MAINTENANCE')?._count ?? 0,
    };

    return {
      totalRooms,
      totalBeds,
      occupiedBeds,
      vacantBeds: totalBeds - occupiedBeds,
      occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      byStatus,
    };
  }

  async feeReport(hostelId: string, startDate?: string, endDate?: string) {
    const where: Prisma.FeeRecordWhereInput = { hostelId };
    if (startDate && endDate) {
      where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    // Use aggregate and groupBy instead of loading all records
    const [totals, statusCounts, byType] = await Promise.all([
      prisma.feeRecord.aggregate({
        where,
        _sum: { amount: true, paidAmount: true },
      }),
      prisma.feeRecord.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.feeRecord.groupBy({
        by: ['type'],
        where,
        _count: true,
        _sum: { amount: true, paidAmount: true },
      }),
    ]);

    const totalCharged = Number(totals._sum.amount ?? 0);
    const totalCollected = Number(totals._sum.paidAmount ?? 0);
    const overdue = statusCounts.find((s) => s.status === 'OVERDUE')?._count ?? 0;
    const pending = statusCounts.find((s) => s.status === 'PENDING')?._count ?? 0;

    const byTypeMap: Record<string, { count: number; amount: number; collected: number }> = {};
    for (const t of byType) {
      byTypeMap[t.type] = {
        count: t._count,
        amount: Number(t._sum.amount ?? 0),
        collected: Number(t._sum.paidAmount ?? 0),
      };
    }

    return { totalCharged, totalCollected, outstandingBalance: totalCharged - totalCollected, overdue, pending, byType: byTypeMap };
  }

  async complaintReport(hostelId: string) {
    // Use groupBy for status and category counts
    const [total, byStatus, byCategory, avgResolution] = await Promise.all([
      prisma.complaint.count({ where: { hostelId, deletedAt: null } }),
      prisma.complaint.groupBy({
        by: ['status'],
        where: { hostelId, deletedAt: null },
        _count: true,
      }),
      prisma.complaint.groupBy({
        by: ['category'],
        where: { hostelId, deletedAt: null },
        _count: true,
      }),
      // For avg resolution time, only load resolved complaints with minimal fields
      prisma.complaint.findMany({
        where: { hostelId, deletedAt: null, resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const s of byStatus) statusMap[s.status] = s._count;

    const categoryMap: Record<string, number> = {};
    for (const c of byCategory) categoryMap[c.category] = c._count;

    const avgResolutionTime = avgResolution.length > 0
      ? avgResolution.reduce((s, c) => s + (c.resolvedAt!.getTime() - c.createdAt.getTime()), 0) / avgResolution.length / (1000 * 60 * 60)
      : 0;

    return {
      total,
      byStatus: statusMap,
      byCategory: categoryMap,
      avgResolutionTimeHours: Math.round(avgResolutionTime * 10) / 10,
    };
  }

  async dashboardStats(hostelId: string) {
    const [studentCount, occupancy, openComplaints, pendingFees, recentActivity] = await Promise.all([
      prisma.studentProfile.count({ where: { user: { hostelId }, status: 'APPROVED' } }),
      this.occupancyReport(hostelId),
      prisma.complaint.count({ where: { hostelId, status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] }, deletedAt: null } }),
      prisma.feeRecord.count({ where: { hostelId, status: { in: ['PENDING', 'OVERDUE'] } } }),
      prisma.auditLog.findMany({ where: { user: { hostelId } }, orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { name: true } } } }),
    ]);

    return { studentCount, occupancy, openComplaints, pendingFees, recentActivity };
  }

  async revenueTrend(hostelId: string, months: number = 6) {
    // Clamp months to prevent excessive queries
    const safeMonths = Math.min(months, 24);
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - safeMonths + 1, 1);

    // Single query to get all fees in the date range
    const fees = await prisma.feeRecord.findMany({
      where: {
        hostelId,
        createdAt: { gte: startDate },
      },
      select: { amount: true, paidAmount: true, createdAt: true },
    });

    // Group by month in JS
    const result: { month: string; collected: number; charged: number }[] = [];
    for (let i = safeMonths - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const monthFees = fees.filter((f) => f.createdAt >= monthStart && f.createdAt <= monthEnd);

      result.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        collected: monthFees.reduce((s, f) => s + Number(f.paidAmount), 0),
        charged: monthFees.reduce((s, f) => s + Number(f.amount), 0),
      });
    }

    return result;
  }

  async gatePassReport(hostelId: string) {
    // Use groupBy for type and status counts
    const [total, byType, byStatus, returnedPasses] = await Promise.all([
      prisma.gatePass.count({ where: { hostelId } }),
      prisma.gatePass.groupBy({ by: ['type'], where: { hostelId }, _count: true }),
      prisma.gatePass.groupBy({ by: ['status'], where: { hostelId }, _count: true }),
      prisma.gatePass.findMany({
        where: { hostelId, actualReturn: { not: null } },
        select: { exitDate: true, actualReturn: true },
      }),
    ]);

    const typeMap: Record<string, number> = {};
    for (const t of byType) typeMap[t.type] = t._count;

    const statusMap: Record<string, number> = {};
    for (const s of byStatus) statusMap[s.status] = s._count;

    let totalDurationHours = 0;
    for (const p of returnedPasses) {
      if (p.actualReturn && p.exitDate) {
        totalDurationHours += (new Date(p.actualReturn).getTime() - new Date(p.exitDate).getTime()) / (1000 * 60 * 60);
      }
    }

    return {
      total,
      byType: typeMap,
      byStatus: statusMap,
      avgDurationHours: returnedPasses.length > 0 ? Math.round((totalDurationHours / returnedPasses.length) * 10) / 10 : 0,
    };
  }

  async visitorReport(hostelId: string) {
    const [total, currentlyInside, visitors] = await Promise.all([
      prisma.visitor.count({ where: { hostelId } }),
      prisma.visitor.count({ where: { hostelId, exitTime: null } }),
      // Only load last 12 months for trend, with minimal fields
      prisma.visitor.findMany({
        where: {
          hostelId,
          entryTime: { gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) },
        },
        select: { entryTime: true },
      }),
    ]);

    const byMonth: Record<string, number> = {};
    for (const v of visitors) {
      const month = v.entryTime.toLocaleString('default', { month: 'short', year: 'numeric' });
      byMonth[month] = (byMonth[month] || 0) + 1;
    }

    return { total, currentlyInside, byMonth };
  }

  async messReport(hostelId: string) {
    // Use groupBy for meal type aggregation
    const [totalBookings, mealStats] = await Promise.all([
      prisma.messBooking.count({ where: { hostelId, isBooked: true } }),
      prisma.messBooking.groupBy({
        by: ['mealType'],
        where: { hostelId, isBooked: true },
        _count: true,
        _avg: { rating: true },
      }),
    ]);

    return {
      totalBookings,
      mealStats: mealStats.map((m) => ({
        meal: m.mealType,
        bookings: m._count,
        avgRating: m._avg.rating ? Math.round(m._avg.rating * 10) / 10 : null,
      })),
    };
  }

  async loginActivityReport(hostelId: string) {
    const history = await prisma.loginHistory.findMany({
      where: { user: { hostelId } },
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: { user: { select: { name: true, role: true } } },
    });

    const byDay: Record<string, number> = {};
    for (const h of history) {
      const day = h.createdAt.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    }

    return {
      totalLogins: history.length,
      byDay,
      recentLogins: history.slice(0, 20),
    };
  }
}

export const reportsService = new ReportsService();
