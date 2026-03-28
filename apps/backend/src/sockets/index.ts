import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { JwtPayload } from '../shared/middleware/authenticate.js';

export function setupSockets(io: Server) {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as JwtPayload;

    // Join user-specific and hostel rooms
    socket.join(`user:${user.userId}`);
    if (user.hostelId) socket.join(`hostel:${user.hostelId}`);

    socket.on('disconnect', () => {
      // Cleanup if needed
    });
  });
}

export function emitToUser(io: Server, userId: string, event: string, data: unknown) {
  io.to(`user:${userId}`).emit(event, data);
}

export function emitToHostel(io: Server, hostelId: string, event: string, data: unknown) {
  io.to(`hostel:${hostelId}`).emit(event, data);
}
