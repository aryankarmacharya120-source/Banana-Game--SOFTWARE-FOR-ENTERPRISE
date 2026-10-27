import { recordMatch } from '../services/matchService.js';

const RECONNECT_GRACE_MS = 20_000;

/**
 * Client -> server events:   room:create, room:join, room:leave, game:move, game:rematch, chat:message
 * Server -> client events:   lobby:rooms, game:state, game:over, chat:message, user:updated
 * Every handler follows the same shape: validate -> mutate RoomManager -> broadcast.
 */
export function registerGameHandlers(io, socket, manager) {
  const user = socket.data.user;

  const broadcastLobby = () => io.to('lobby').emit('lobby:rooms', manager.lobbyList());
  const broadcastRoom = (room) => io.to(room.id).emit('game:state', manager.view(room));

  const announceFinish = async (room, finished) => {
    const ratingChanges = await recordMatch(room, finished);
    io.to(room.id).emit('game:over', { ...finished, ratingChanges });
  };

  socket.join('lobby');
  socket.emit('lobby:rooms', manager.lobbyList());

  // Re-attach after refresh / reconnect
  const existing = manager.roomOf(user.id);
  if (existing) {
    manager.clearTimer(existing, user.id);
    manager.setConnected(user.id, true);
    socket.leave('lobby');
    socket.join(existing.id);
    broadcastRoom(existing);
  }

  socket.on('room:create', ({ name } = {}, cb = () => {}) => {
    const res = manager.create(user, name);
    if (res.error) return cb({ error: res.error });
    socket.leave('lobby');
    socket.join(res.room.id);
    broadcastLobby();
    cb({ roomId: res.room.id });
  });

  socket.on('room:join', ({ roomId } = {}, cb = () => {}) => {
    const res = manager.join(user, roomId);
    if (res.error) return cb({ error: res.error });
    socket.leave('lobby');
    socket.join(res.room.id);
    manager.setConnected(user.id, true);
    broadcastRoom(res.room);
    broadcastLobby();
    cb({ roomId: res.room.id });
  });

  socket.on('room:leave', async () => {
    const { room, deleted, finished } = manager.leave(user.id);
    if (!room) return;
    socket.leave(room.id);
    socket.join('lobby');
    if (finished) await announceFinish(room, finished);
    if (!deleted) broadcastRoom(room);
    broadcastLobby();
  });

  socket.on('game:move', async ({ col } = {}, cb = () => {}) => {
    const res = manager.move(user.id, col);
    if (res.error) return cb({ error: res.error });
    cb({ ok: true });
    broadcastRoom(res.room);
    if (res.finished) await announceFinish(res.room, res.finished);
  });

  socket.on('game:rematch', () => {
    const res = manager.requestRematch(user.id);
    if (res.room) broadcastRoom(res.room);
  });

  socket.on('chat:message', ({ text } = {}) => {
    if (typeof text !== 'string' || !text.trim()) return;
    const { room, msg } = manager.addChat(user.id, text.trim());
    if (room) io.to(room.id).emit('chat:message', msg);
  });

  socket.on('disconnect', () => {
    const room = manager.roomOf(user.id);
    if (!room) return;
    // Ignore if the same user still has another live socket (e.g. second tab)
    const stillOnline = [...io.sockets.sockets.values()].some((s) => s.id !== socket.id && s.data.user?.id === user.id);
    if (stillOnline) return;

    manager.setConnected(user.id, false);
    broadcastRoom(room);

    const timer = setTimeout(async () => {
      const { room: r, deleted, finished } = manager.leave(user.id);
      if (!r) return;
      if (finished) await announceFinish(r, finished);
      if (!deleted) broadcastRoom(r);
      broadcastLobby();
    }, RECONNECT_GRACE_MS);
    room.disconnectTimers.set(user.id, timer);
  });
}
