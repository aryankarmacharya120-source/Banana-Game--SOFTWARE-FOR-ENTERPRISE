import { Server } from 'socket.io';
import cookie from 'cookie';
import User from '../models/User.js';
import { COOKIE_NAME, verifyToken } from '../middleware/auth.js';
import { env } from '../config/env.js';
import { RoomManager } from '../game/roomManager.js';
import { registerGameHandlers } from './gameHandlers.js';

/**
 * EVENT-DRIVEN PROGRAMMING + VIRTUAL IDENTITY
 * The socket handshake re-uses the same httpOnly JWT cookie as the REST API, so a socket
 * connection is only accepted for an authenticated user (io.use middleware).
 */
export function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.clientOrigin, credentials: true },
  });
  const manager = new RoomManager();

  io.use(async (socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || '');
      const payload = verifyToken(cookies[COOKIE_NAME]);
      if (!payload) return next(new Error('unauthorized'));
      const user = await User.findById(payload.sub).select('username avatarSeed');
      if (!user) return next(new Error('unauthorized'));
      socket.data.user = { id: user._id.toString(), username: user.username, avatarSeed: user.avatarSeed };
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => registerGameHandlers(io, socket, manager));
  return io;
}
