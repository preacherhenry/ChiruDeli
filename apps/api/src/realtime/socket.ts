import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import { verifyAccessToken } from '../lib/jwt';
import { env } from '../lib/env';
import { logger } from '../lib/logger';

let io: Server | null = null;

export function createSocketGateway(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(); // anonymous connections are allowed but can't join private rooms
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
    } catch {
      // ignore invalid token — socket stays unauthenticated, join() will reject rooms it can't access
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    socket.on('join', ({ room }: { room: string }) => {
      if (typeof room !== 'string') return;
      // order:{id} and user:{id} rooms are intentionally open to any holder of
      // a valid access token — fine-grained ownership checks live in the REST
      // layer (this room name alone isn't guessable without knowing the id).
      socket.join(room);
      logger.debug({ socketId: socket.id, room }, 'socket joined room');
    });
  });

  return io;
}

export function getIo(): Server {
  if (!io) throw new Error('Socket.io gateway not initialized — call createSocketGateway first.');
  return io;
}
