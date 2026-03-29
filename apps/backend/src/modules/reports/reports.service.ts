import { prisma } from '../../config/database.js';

export class ReportsService {
  async occupancyReport(hostelId: string) {
    const rooms = await prisma.room.findMany({
      where: { block: { hostelId } },
      include: { beds: true },
    });

    const total = rooms.length;
    const totalBeds = rooms.reduce((s, r) => s + r.beds.length, 0);
    const occupiedBeds = rooms.reduce((s, r) => s + r.beds.filter((b) => b.status === 'OCCUPIED').length, 0);
    const byStatus = {
      available: rooms.filter((r) => r.status === 'AVAILABLE').length,
      occupied: rooms.filter((r) => r.status === 'OCCUPIED').length,
      partiallyOccupied: rooms.filter((r) => r.status === 'PARTIALLY_OCCUPIED').length,
      underMaintenance: rooms.filter((r) => r.status === 'UNDER_MAINTENANCE').length,
    };

    return {
      totalRooms: total,
      totalBeds,
      occupiedBeds,
      vacantBeds: totalBeds - occupiedBeds,
      occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      byStatus,
    };
  }

  async feeReport(hostelId: string, startDate?: string, endDate?: string) {
    const where: any = { hostelId };
    if (startDate && endDate) {
      where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const fees = await prisma.feeRecord.findMany({ where });

    const totalCharged = fees.reduce((s, f) => s + Number(f.amount), 0);
    const totalCollected = fees.reduce((s, f) => s + Number(f.paidAmount), 0);
    const overdue = fees.filter((f) => f.status === 'OVERDUE').length;
    const pending = fees.filter((f) => f.status === 'PENDING').length;

    const byType: Record<string, { count: number; amount: number; collected: number }> = {};
    for (const fee of fees) {
      if (!byType[fee.type]) byType[fee.type] = { count: 0, amount: 0, collected: 0 };
      byType[fee.type].count++;
      byType[fee.type].amount += Number(fee.amount);
      byType[fee.type].collected += Number(fee.paidAmount);
    }

    return { totalCharged, totalCollected, outstandingBalance: totalCharged - totalCollected, overdue, pending, byType };
  }

  async complaintReport(hostelId: string) {
    const complaints = await prisma.complaint.findMany({
      where: { hostelId, deletedAt: null },
    });

    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    for (const c of complaints) {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    }

    const resolved = complaints.filter((c) => c.resolvedAt);
    const avgResolutionTime = resolved.length > 0
      ? resolved.reduce((s, c) => s + (c.resolvedAt!.getTime() - c.createdAt.getTime()), 0) / resolved.length / (1000 * 60 * 60)
      : 0;

    return {
      total: complaints.length,
      byStatus,
      byCategory,
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
    const result: { month: string; collected: number; charged: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const fees = await prisma.feeRecord.findMany({
        where: { hostelId, createdAt: { gte: start, lte: end } },
      });

      result.push({
        month: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
        collected: fees.reduce((s, f) => s + Number(f.paidAmount), 0),
        charged: fees.reduce((s, f) => s + Number(f.amount), 0),
      });
    }

    return result;
  }
  async gatePassReport(hostelId: string) {
    const passes = await prisma.gatePass.findMany({ where: { hostelId } });

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalDurationHours = 0;
    let returnedCount = 0;

    for (const p of passes) {
      byType[p.type] = (byType[p.type] || 0) + 1;
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      if (p.actualReturn && p.exitDate) {
        totalDurationHours += (new Date(p.actualReturn).getTime() - new Date(p.exitDate).getTime()) / (1000 * 60 * 60);
        returnedCount++;
      }
    }

    return {
      total: passes.length,
      byType,
      byStatus,
      avgDurationHours: returnedCount > 0 ? Math.round((totalDurationHours / returnedCount) * 10) / 10 : 0,
    };
  }

  async visitorReport(hostelId: string) {
    const visitors = await prisma.visitor.findMany({ where: { hostelId } });

    const byMonth: Record<string, number> = {};
    let currentlyInside = 0;

    for (const v of visitors) {
      const month = v.entryTime.toLocaleString('default', { month: 'short', year: 'numeric' });
      byMonth[month] = (byMonth[month] || 0) + 1;
      if (!v.exitTime) currentlyInside++;
    }

    return {
      total: visitors.length,
      currentlyInside,
      byMonth,
    };
  }

  async messReport(hostelId: string) {
    const bookings = await prisma.messBooking.findMany({ where: { hostelId } });

    const byMealType: Record<string, { count: number; totalRating: number; ratedCount: number }> = {};
    for (const b of bookings) {
      if (!byMealType[b.mealType]) byMealType[b.mealType] = { count: 0, totalRating: 0, ratedCount: 0 };
      byMealType[b.mealType].count++;
      if (b.rating) {
        byMealType[b.mealType].totalRating += b.rating;
        byMealType[b.mealType].ratedCount++;
      }
    }

    const mealStats = Object.entries(byMealType).map(([meal, data]) => ({
      meal,
      bookings: data.count,
      avgRating: data.ratedCount > 0 ? Math.round((data.totalRating / data.ratedCount) * 10) / 10 : null,
    }));

    return {
      totalBookings: bookings.length,
      mealStats,
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
