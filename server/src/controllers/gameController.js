import { GameService } from '../game/gameService.js';
import { fetchBananaQuestion } from '../services/bananaClient.js';
import { gameEvents } from '../events/gameEvents.js';

// One service instance for the whole server; it owns the in-memory runs.
export const gameService = new GameService({ getQuestion: fetchBananaQuestion, events: gameEvents });

const handle = (fn) => async (req, res, next) => {
  try {
    res.json(await fn(req));
  } catch (err) {
    next(err); // GameError / UpstreamError carry their own HTTP status
  }
};

export const start = handle(async (req) => ({ state: await gameService.start(req.userId) }));
export const question = handle(async (req) => ({ state: await gameService.question(req.userId) }));
export const answer = handle((req) =>
  gameService.answer(req.userId, { questionId: req.body?.questionId, answer: req.body?.answer })
);
export const end = handle(async (req) => ({ summary: await gameService.end(req.userId) }));
