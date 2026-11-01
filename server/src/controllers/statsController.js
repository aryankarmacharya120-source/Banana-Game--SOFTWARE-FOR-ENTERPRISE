import User from '../models/User.js';
import Game from '../models/Game.js';

export async function leaderboard(req, res, next) {
  try {
    const users = await User.find({ gamesPlayed: { $gt: 0 } })
      .sort({ bestScore: -1, totalCorrect: -1 })
      .limit(10)
      .select('username avatarSeed bestScore bestStreak gamesPlayed totalCorrect totalAnswered');
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function myGames(req, res, next) {
  try {
    const games = await Game.find({ user: req.userId }).sort({ createdAt: -1 }).limit(10);
    res.json({ games });
  } catch (err) {
    next(err);
  }
}
