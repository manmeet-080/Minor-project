import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { env } from './config/env.js';
import { setupSockets } from './sockets/index.js';
import { setIoInstance } from './sockets/events.js';
import { setupQueues } from './jobs/queue.js';
import { setupWorkers } from './jobs/workers.js';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setupSockets(io);
setIoInstance(io);

// Make io accessible to routes
app.set('io', io);

// Initialize background jobs
setupQueues();
setupWorkers();

server.listen(env.PORT, () => {
  console.log(`Campusphere Backend running on port ${env.PORT}`);
});
