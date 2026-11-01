import User from '../models/User.js';
import Game from '../models/Game.js';
import { EVENTS, gameEvents } from './gameEvents.js';

/** Subscribes the persistence handlers. Called once at start-up (see src/index.js). */
export function registerGameListeners(events = gameEvents) {
  // Fired after every answer: keep lifetime accuracy numbers up to date.
  events.on(EVENTS.ANSWER_CHECKED, async ({ userId, correct }) => {
    await User.updateOne({ _id: userId }, { $inc: { totalAnswered: 1, totalCorrect: correct ? 1 : 0 } });
  });

  // Fired once when a run ends: store it and update the player's personal bests.
  events.on(EVENTS.GAME_FINISHED, async (run) => {
    const user = await User.findByIdAndUpdate(
      run.userId,
      { $inc: { gamesPlayed: 1 }, $max: { bestScore: run.score, bestStreak: run.bestStreak } },
      { new: true }
    );
    if (!user) return;
    await Game.create({
      user: user._id,
      username: user.username,
      score: run.score,
      correct: run.correct,
      wrong: run.wrong,
      bestStreak: run.bestStreak,
      endedBy: run.endedBy,
      durationMs: run.durationMs,
    });
  });
}
