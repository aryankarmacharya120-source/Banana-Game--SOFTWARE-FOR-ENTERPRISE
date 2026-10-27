import { randomBytes } from 'node:crypto';
import { createBoard, dropDisc, findWin, isDraw } from './connectFour.js';

/**
 * In-memory room registry. Rooms are short-lived game sessions, so they live in RAM;
 * only finished matches are persisted to MongoDB (see matchService).
 */
export class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> room
    this.userRoom = new Map(); // userId -> roomId
  }

  #freshGame(room) {
    room.board = createBoard();
    room.turn = 'red';
    room.status = room.players.length === 2 ? 'playing' : 'waiting';
    room.winner = null;
    room.winningCells = [];
    room.lastMove = null;
    room.moves = 0;
    room.rematch = new Set();
  }

  create(user, name) {
    if (this.userRoom.has(user.id)) return { error: 'You are already in a room' };
    const id = randomBytes(3).toString('hex');
    const room = {
      id,
      name: (name || `${user.username}'s room`).slice(0, 30),
      players: [],
      chat: [],
      disconnectTimers: new Map(),
    };
    this.#addPlayer(room, user, 'red');
    this.#freshGame(room);
    this.rooms.set(id, room);
    return { room };
  }

  join(user, id) {
    const room = this.rooms.get(id);
    if (!room) return { error: 'Room not found' };
    if (room.players.some((p) => p.userId === user.id)) return { room }; // reconnect / refresh
    if (this.userRoom.has(user.id)) return { error: 'You are already in another room' };
    if (room.players.length >= 2) return { error: 'Room is full' };
    this.#addPlayer(room, user, 'yellow');
    this.#freshGame(room);
    return { room, started: true };
  }

  #addPlayer(room, user, color) {
    room.players.push({
      userId: user.id,
      username: user.username,
      avatarSeed: user.avatarSeed,
      color,
      connected: true,
    });
    this.userRoom.set(user.id, room.id);
  }

  roomOf(userId) {
    return this.rooms.get(this.userRoom.get(userId));
  }

  move(userId, col) {
    const room = this.roomOf(userId);
    if (!room) return { error: 'You are not in a room' };
    if (room.status !== 'playing') return { error: 'Game is not in progress' };
    const player = room.players.find((p) => p.userId === userId);
    if (player.color !== room.turn) return { error: 'Not your turn' };

    const res = dropDisc(room.board, col, player.color);
    if (res.error) return { error: res.error };

    room.moves++;
    room.lastMove = { row: res.row, col, color: player.color };
    const win = findWin(room.board, res.row, col);
    if (win) {
      room.status = 'finished';
      room.winner = player.userId;
      room.winningCells = win;
      return { room, finished: { result: 'win', winnerId: player.userId } };
    }
    if (isDraw(room.board)) {
      room.status = 'finished';
      return { room, finished: { result: 'draw', winnerId: null } };
    }
    room.turn = room.turn === 'red' ? 'yellow' : 'red';
    return { room };
  }

  /** A player leaves or times out. Returns what the caller should broadcast / persist. */
  leave(userId) {
    const room = this.roomOf(userId);
    if (!room) return {};
    this.clearTimer(room, userId);

    let finished = null;
    if (room.status === 'playing') {
      const opponent = room.players.find((p) => p.userId !== userId);
      room.status = 'finished';
      room.winner = opponent.userId;
      finished = { result: 'forfeit', winnerId: opponent.userId };
    }

    room.players = room.players.filter((p) => p.userId !== userId);
    this.userRoom.delete(userId);
    room.rematch?.delete(userId);

    if (room.players.length === 0) {
      this.rooms.delete(room.id);
      return { room, deleted: true, finished };
    }
    if (room.status !== 'finished') this.#freshGame(room);
    return { room, finished };
  }

  setConnected(userId, connected) {
    const room = this.roomOf(userId);
    const p = room?.players.find((x) => x.userId === userId);
    if (p) p.connected = connected;
    return room;
  }

  clearTimer(room, userId) {
    const t = room.disconnectTimers.get(userId);
    if (t) clearTimeout(t);
    room.disconnectTimers.delete(userId);
  }

  requestRematch(userId) {
    const room = this.roomOf(userId);
    if (!room || room.status !== 'finished' || room.players.length < 2) return {};
    room.rematch.add(userId);
    if (room.rematch.size === 2) {
      // loser starts as red next game so first-move advantage alternates
      room.players.forEach((p) => (p.color = p.color === 'red' ? 'yellow' : 'red'));
      this.#freshGame(room);
      return { room, restarted: true };
    }
    return { room };
  }

  addChat(userId, text) {
    const room = this.roomOf(userId);
    if (!room) return {};
    const p = room.players.find((x) => x.userId === userId);
    const msg = { id: randomBytes(4).toString('hex'), from: p.username, color: p.color, text: text.slice(0, 200), at: Date.now() };
    room.chat.push(msg);
    if (room.chat.length > 50) room.chat.shift();
    return { room, msg };
  }

  /** Serialisable snapshot sent to clients. */
  view(room) {
    return {
      id: room.id,
      name: room.name,
      status: room.status,
      players: room.players,
      board: room.board,
      turn: room.turn,
      winner: room.winner,
      winningCells: room.winningCells,
      lastMove: room.lastMove,
      rematch: [...room.rematch],
      chat: room.chat,
    };
  }

  lobbyList() {
    return [...this.rooms.values()]
      .filter((r) => r.status === 'waiting')
      .map((r) => ({ id: r.id, name: r.name, host: r.players[0]?.username, hostAvatar: r.players[0]?.avatarSeed }));
  }
}
