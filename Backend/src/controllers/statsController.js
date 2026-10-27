import User from '../models/User.js';
import Match from '../models/Match.js';

export async function leaderboard(req, res, next) {
  try {
    const users = await User.find({ $expr: { $gt: [{ $add: ['$wins', '$losses', '$draws'] }, 0] } })
      .sort({ rating: -1 })
      .limit(10)
      .select('username avatarSeed rating wins losses draws');
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function myMatches(req, res, next) {
  try {
    const matches = await Match.find({ 'players.user': req.userId }).sort({ createdAt: -1 }).limit(10);
    res.json({ matches });
  } catch (err) {
    next(err);
  }
}
