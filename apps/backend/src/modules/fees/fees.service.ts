import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import { Prisma, FeeStatus } from '@prisma/client';

export class FeesService {
  async list(query: {
    hostelId?: string; studentId?: string; status?: string; type?: string;
    page?: number; limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: Prisma.FeeRecordWhereInput = {
      ...(query.hostelId && { hostelId: query.hostelId }),
      ...(query.studentId && { studentId: query.studentId }),
      ...(query.status && { status: query.status as FeeStatus }),
      ...(query.type && { type: query.type as any }),
    };

    const [fees, total] = await Promise.all([
      prisma.feeRecord.findMany({
        where,
        include: { student: { include: { user: { select: { name: true, email: true, phone: true } } } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dueDate: 'desc' },
      }),
      prisma.feeRecord.count({ where }),
    ]);

    return { fees, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string) {
    const fee = await prisma.feeRecord.findUnique({
      where: { id },
      include: { student: { include: { user: { select: { name: true, email: true } } } } },
    });
    if (!fee) throw new AppError(404, 'Fee record not found');
    return fee;
  }

  async create(data: {
    studentId: string; hostelId: string; type: string; amount: number;
    dueDate: string; remarks?: string;
  }) {
    return prisma.feeRecord.create({
      data: {
        studentId: data.studentId,
        hostelId: data.hostelId,
        type: data.type as any,
        amount: data.amount,
        dueDate: new Date(data.dueDate),
        remarks: data.remarks,
      },
    });
  }

  async recordPayment(id: string, data: {
    paidAmount: number; paymentMethod: string; transactionId?: string;
  }) {
    const fee = await prisma.feeRecord.findUnique({ where: { id } });
    if (!fee) throw new AppError(404, 'Fee record not found');

    const totalPaid = Number(fee.paidAmount) + data.paidAmount;
    const status: FeeStatus = totalPaid >= Number(fee.amount) ? 'PAID' : 'PARTIALLY_PAID';

    return prisma.feeRecord.update({
      where: { id },
      data: {
        paidAmount: totalPaid,
        paidDate: new Date(),
        paymentMethod: data.paymentMethod as any,
        transactionId: data.transactionId,
        status,
      },
    });
  }

  async waive(id: string, remarks: string) {
    return prisma.feeRecord.update({
      where: { id },
      data: { status: 'WAIVED', remarks },
    });
  }

  async getStudentBalance(studentId: string) {
    const fees = await prisma.feeRecord.findMany({
      where: { studentId, status: { in: ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'] } },
    });
    const totalDue = fees.reduce((sum, f) => sum + Number(f.amount) - Number(f.paidAmount), 0);
    return { totalDue, pendingFees: fees.length };
  }

  async generateReceipt(id: string) {
    const fee = await prisma.feeRecord.findUnique({
      where: { id },
      include: {
        student: { include: { user: { select: { name: true, email: true, phone: true } } } },
        hostel: { select: { name: true, address: true } },
      },
    });
    if (!fee) throw new AppError(404, 'Fee record not found');
    if (fee.status !== 'PAID' && fee.status !== 'PARTIALLY_PAID') {
      throw new AppError(400, 'Receipt only available for paid fees');
    }

    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
  .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { margin: 0; color: #3b82f6; font-size: 24px; }
  .header p { margin: 4px 0; color: #666; font-size: 12px; }
  .details { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .details .label { color: #666; font-size: 12px; }
  .details .value { font-weight: 600; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; font-size: 13px; }
  th { background: #f8f9fa; font-weight: 600; }
  .total { font-size: 18px; font-weight: 700; text-align: right; color: #22c55e; }
  .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #999; }
</style></head><body>
  <div class="header">
    <h1>Campusphere</h1>
    <p>${fee.hostel?.name || 'Hostel'} | ${fee.hostel?.address || ''}</p>
    <p>Payment Receipt</p>
  </div>
  <div class="details">
    <div><span class="label">Receipt #</span><br><span class="value">${fee.id.slice(0, 8).toUpperCase()}</span></div>
    <div><span class="label">Date</span><br><span class="value">${fee.paidDate ? new Date(fee.paidDate).toLocaleDateString() : 'N/A'}</span></div>
    <div><span class="label">Student</span><br><span class="value">${fee.student?.user?.name || 'N/A'}</span></div>
    <div><span class="label">Email</span><br><span class="value">${fee.student?.user?.email || 'N/A'}</span></div>
  </div>
  <table>
    <thead><tr><th>Description</th><th>Amount</th></tr></thead>
    <tbody>
      <tr><td>${fee.type.replace(/_/g, ' ')}</td><td>Rs. ${Number(fee.amount).toLocaleString('en-IN')}</td></tr>
    </tbody>
  </table>
  <p class="total">Paid: Rs. ${Number(fee.paidAmount).toLocaleString('en-IN')}</p>
  <p style="font-size:12px;color:#666;">Payment Method: ${fee.paymentMethod || 'N/A'}${fee.transactionId ? ' | Txn: ' + fee.transactionId : ''}</p>
  <div class="footer">
    <p>This is a computer-generated receipt. No signature required.</p>
    <p>Campusphere - Smart Campus Management Platform</p>
  </div>
</body></html>`;

    return html;
  }
}

export const feesService = new FeesService();
