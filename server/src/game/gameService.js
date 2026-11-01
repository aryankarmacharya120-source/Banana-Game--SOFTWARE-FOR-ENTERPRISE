/**
 * Game logic for the Banana math game, independent of HTTP and of MongoDB.
 *
 * REFERENCE: the flow (load question -> show 4 options -> check answer -> score -> next question)
 * follows keshavroka55/banana (client/js/script.js). It is moved to the server so that:
 *   - the solution never reaches the browser until the answer has been submitted,
 *   - score, lives and streak cannot be edited by the player,
 *   - results can be stored per authenticated user (virtual identity).
 *
 * Dependencies are injected (`getQuestion`, `events`, `now`, `rng`) so the rules can be unit
 * tested without the network or a database.
 *
 * AI assistance: drafted with Claude (Anthropic) and reviewed by the author.
 */
import { randomBytes } from 'node:crypto';
import { generateOptions } from './options.js';
import { EVENTS } from '../events/gameEvents.js';
import { SESSION_IDLE_MS, STARTING_LIVES, pointsFor } from './rules.js';

export class GameError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'GameError';
    this.status = status;
  }
}

export class GameService {
  /** userId -> in-memory run. Only finished runs are persisted (via the 'game:finished' event). */
  sessions = new Map();

  constructor({ getQuestion, events, now = Date.now, rng = Math.random }) {
    this.getQuestion = getQuestion;
    this.events = events;
    this.now = now;
    this.rng = rng;
  }

  // ---- public API (one method per player action) -------------------------------------------

  /** Starts a fresh run. A run already in progress is banked first, so nothing is lost. */
  async start(userId) {
    const previous = this.#get(userId);
    if (previous) await this.#finish(previous, 'quit');

    const t = this.now();
    const session = {
      userId,
      score: 0,
      lives: STARTING_LIVES,
      streak: 0,
      bestStreak: 0,
      correct: 0,
      wrong: 0,
      startedAt: t,
      touchedAt: t,
      current: null, // { id, imageUrl, solution, options } - `solution` stays on the server
      pending: null,
    };
    this.sessions.set(userId, session);
    await this.#ensureQuestion(session);
    return this.#view(session);
  }

  /** Returns the current question, fetching one if needed (also used to retry after an API error). */
  async question(userId) {
    const session = this.#require(userId);
    await this.#ensureQuestion(session);
    return this.#view(session);
  }

  /** Checks an answer, updates score / lives / streak and ends the run when lives hit zero. */
  async answer(userId, { questionId, answer }) {
    const session = this.#require(userId);
    const q = session.current;
    if (!q) throw new GameError('There is no open question', 409);
    if (questionId !== q.id) throw new GameError('That question is no longer active', 409);

    const value = Number(answer);
    if (!Number.isInteger(value) || !q.options.includes(value)) throw new GameError('Invalid answer', 400);

    session.current = null; // consumed before any await, so a double click cannot score twice

    const correct = value === q.solution;
    let points = 0;
    if (correct) {
      session.streak += 1;
      session.bestStreak = Math.max(session.bestStreak, session.streak);
      session.correct += 1;
      points = pointsFor(session.streak);
      session.score += points;
    } else {
      session.streak = 0;
      session.wrong += 1;
      session.lives -= 1;
    }
    await this.events.emitAsync(EVENTS.ANSWER_CHECKED, { userId, correct, points, streak: session.streak });

    const summary = session.lives <= 0 ? await this.#finish(session, 'lives') : null;
    return { correct, correctAnswer: q.solution, points, gameOver: Boolean(summary), summary, state: this.#view(session) };
  }

  /** Cash out: ends the run now and records the score. */
  async end(userId) {
    const session = this.#require(userId);
    return this.#finish(session, 'quit');
  }

  /** Drops runs nobody has touched for a while. Call from a timer. */
  sweepExpired() {
    for (const [userId, s] of this.sessions) {
      if (this.now() - s.touchedAt > SESSION_IDLE_MS) this.sessions.delete(userId);
    }
  }

  // ---- internals ---------------------------------------------------------------------------

  #get(userId) {
    const s = this.sessions.get(userId);
    if (s && this.now() - s.touchedAt > SESSION_IDLE_MS) {
      this.sessions.delete(userId);
      return null;
    }
    if (s) s.touchedAt = this.now();
    return s ?? null;
  }

  #require(userId) {
    const s = this.#get(userId);
    if (!s) throw new GameError('No active game - start one first', 404);
    return s;
  }

  async #ensureQuestion(session) {
    if (session.current) return;
    // Share one in-flight request so two quick calls cannot issue two different questions.
    session.pending ??= (async () => {
      try {
        const { imageUrl, solution } = await this.getQuestion();
        session.current = {
          id: randomBytes(6).toString('hex'),
          imageUrl,
          solution,
          options: generateOptions(solution, this.rng),
        };
      } finally {
        session.pending = null;
      }
    })();
    await session.pending;
  }

  async #finish(session, endedBy) {
    this.sessions.delete(session.userId);
    const summary = {
      score: session.score,
      correct: session.correct,
      wrong: session.wrong,
      bestStreak: session.bestStreak,
      endedBy,
      durationMs: this.now() - session.startedAt,
    };
    // A run with no answers is not worth recording.
    if (session.correct + session.wrong > 0) {
      await this.events.emitAsync(EVENTS.GAME_FINISHED, { userId: session.userId, ...summary });
    }
    return summary;
  }

  /** What the browser is allowed to see: never the solution. */
  #view(s) {
    return {
      score: s.score,
      lives: s.lives,
      maxLives: STARTING_LIVES,
      streak: s.streak,
      bestStreak: s.bestStreak,
      correct: s.correct,
      wrong: s.wrong,
      question: s.current ? { id: s.current.id, imageUrl: s.current.imageUrl, options: s.current.options } : null,
    };
  }
}
