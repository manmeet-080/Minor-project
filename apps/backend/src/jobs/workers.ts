import { Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import { prisma } from '../config/database.js';

const connection = { host: redis.options.host || 'localhost', port: redis.options.port || 6379 };

export function setupWorkers() {
  // Mark overdue fees
  new Worker('fee-checks', async () => {
    const now = new Date();
    const updated = await prisma.feeRecord.updateMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: now },
      },
      data: { status: 'OVERDUE' },
    });
    if (updated.count > 0) {
      console.log(`[fee-checks] Marked ${updated.count} fees as OVERDUE`);
    }
  }, { connection });

  // Mark expired gate passes
  new Worker('gate-pass-checks', async () => {
    const now = new Date();
    const updated = await prisma.gatePass.updateMany({
      where: {
        status: { in: ['APPROVED', 'CHECKED_OUT'] },
        expectedReturn: { lt: now },
      },
      data: { status: 'EXPIRED' },
    });
    if (updated.count > 0) {
      console.log(`[gate-pass-checks] Marked ${updated.count} gate passes as EXPIRED`);
    }
  }, { connection });

  // Clean up old read notifications (30+ days)
  new Worker('notification-cleanup', async () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const deleted = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: cutoff },
      },
    });
    if (deleted.count > 0) {
      console.log(`[notification-cleanup] Removed ${deleted.count} old notifications`);
    }
  }, { connection });

  console.log('Job workers started');
}
