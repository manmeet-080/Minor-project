import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import { MealType, DayOfWeek } from '@prisma/client';

export class MessService {
  async getMenu(hostelId: string) {
    return prisma.messMenu.findMany({
      where: { hostelId, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
    });
  }

  async updateMenu(hostelId: string, dayOfWeek: DayOfWeek, mealType: MealType, items: string[]) {
    return prisma.messMenu.upsert({
      where: { hostelId_dayOfWeek_mealType: { hostelId, dayOfWeek, mealType } },
      update: { items },
      create: { hostelId, dayOfWeek, mealType, items },
    });
  }

  async bookMeal(studentId: string, hostelId: string, date: string, mealType: MealType) {
    const dateObj = new Date(date);
    return prisma.messBooking.upsert({
      where: { studentId_date_mealType: { studentId, date: dateObj, mealType } },
      update: { isBooked: true },
      create: { studentId, hostelId, date: dateObj, mealType },
    });
  }

  async cancelMeal(studentId: string, date: string, mealType: MealType) {
    const dateObj = new Date(date);
    const booking = await prisma.messBooking.findUnique({
      where: { studentId_date_mealType: { studentId, date: dateObj, mealType } },
    });
    if (!booking) throw new AppError(404, 'Booking not found');
    return prisma.messBooking.update({ where: { id: booking.id }, data: { isBooked: false } });
  }

  async submitFeedback(bookingId: string, feedback: string, rating: number) {
    return prisma.messBooking.update({
      where: { id: bookingId },
      data: { feedback, rating },
    });
  }

  async getBookings(studentId: string, startDate: string, endDate: string) {
    return prisma.messBooking.findMany({
      where: {
        studentId,
        date: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
    });
  }

  async getMonthlyReport(hostelId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const bookings = await prisma.messBooking.groupBy({
      by: ['mealType'],
      where: { hostelId, date: { gte: startDate, lte: endDate }, isBooked: true },
      _count: true,
    });

    return bookings;
  }
  async calculateMonthlyFee(studentId: string, month: number, year: number, ratePerMeal: number = 50) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const bookings = await prisma.messBooking.count({
      where: {
        studentId,
        date: { gte: startDate, lte: endDate },
        isBooked: true,
      },
    });

    return {
      studentId,
      month,
      year,
      totalMeals: bookings,
      ratePerMeal,
      totalFee: bookings * ratePerMeal,
    };
  }
}

export const messService = new MessService();
