import User from '../models/User.js';
import Match from '../models/Match.js';

const K = 32;
const expected = (a, b) => 1 / (1 + 10 ** ((b - a) / 400));

/** Persists a finished game and updates both players' Elo-style ratings. */
export async function recordMatch(room, finished) {
  try {
    const [p1, p2] = room.players;
    if (!p1 || !p2) return;
    const [u1, u2] = await Promise.all([User.findById(p1.userId), User.findById(p2.userId)]);
    if (!u1 || !u2) return;

    const score1 = finished.result === 'draw' ? 0.5 : finished.winnerId === p1.userId ? 1 : 0;
    const d1 = Math.round(K * (score1 - expected(u1.rating, u2.rating)));
    const d2 = Math.round(K * (1 - score1 - expected(u2.rating, u1.rating)));

    for (const [u, score, d] of [[u1, score1, d1], [u2, 1 - score1, d2]]) {
      u.rating += d;
      if (score === 1) u.wins++;
      else if (score === 0) u.losses++;
      else u.draws++;
      await u.save();
    }

    await Match.create({
      players: [
        { user: u1._id, username: u1.username, color: p1.color, ratingChange: d1 },
        { user: u2._id, username: u2.username, color: p2.color, ratingChange: d2 },
      ],
      winner: finished.winnerId || null,
      result: finished.result,
      moves: room.moves,
    });
    return { [p1.userId]: d1, [p2.userId]: d2 };
  } catch (err) {
    console.error('[match] failed to record', err);
  }
}
