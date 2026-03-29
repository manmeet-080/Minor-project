import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './shared/middleware/errorHandler.js';
import authRouter from './modules/auth/auth.router.js';
import studentsRouter from './modules/students/students.router.js';
import roomsRouter from './modules/rooms/rooms.router.js';
import complaintsRouter from './modules/complaints/complaints.router.js';
import feesRouter from './modules/fees/fees.router.js';
import messRouter from './modules/mess/mess.router.js';
import gatePassRouter from './modules/gate-pass/gate-pass.router.js';
import visitorsRouter from './modules/visitors/visitors.router.js';
import notificationsRouter from './modules/notifications/notifications.router.js';
import reportsRouter from './modules/reports/reports.router.js';
import usersRouter from './modules/users/users.router.js';
import hostelsRouter from './modules/hostels/hostels.router.js';
import auditLogsRouter from './modules/audit-logs/audit-logs.router.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/students', studentsRouter);
app.use('/api/v1/rooms', roomsRouter);
app.use('/api/v1/complaints', complaintsRouter);
app.use('/api/v1/fees', feesRouter);
app.use('/api/v1/mess', messRouter);
app.use('/api/v1/gate-passes', gatePassRouter);
app.use('/api/v1/visitors', visitorsRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/hostels', hostelsRouter);
app.use('/api/v1/audit-logs', auditLogsRouter);

app.use(errorHandler);

export default app;
