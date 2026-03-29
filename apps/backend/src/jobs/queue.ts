import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis.js';

const connection = { host: redis.options.host || 'localhost', port: redis.options.port || 6379 };

export const feeQueue = new Queue('fee-checks', { connection });
export const gatePassQueue = new Queue('gate-pass-checks', { connection });
export const notificationQueue = new Queue('notification-cleanup', { connection });

export function setupQueues() {
  // Schedule recurring jobs
  feeQueue.add('check-overdue', {}, { repeat: { pattern: '0 0 * * *' } }); // daily at midnight
  gatePassQueue.add('check-expired', {}, { repeat: { pattern: '0 */6 * * *' } }); // every 6 hours
  notificationQueue.add('cleanup-old', {}, { repeat: { pattern: '0 2 * * 0' } }); // weekly Sunday 2am

  console.log('Job queues initialized');
}
