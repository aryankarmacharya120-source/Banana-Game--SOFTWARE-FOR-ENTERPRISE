/**
 * EVENT-DRIVEN PROGRAMMING (server side)
 *
 * The game service does not know how results are stored. It announces what happened and any
 * number of listeners react:
 *
 *     gameService --emit--> 'answer:checked'  --> listener updates the player's answer stats
 *                           'game:finished'   --> listener saves the run + updates best scores
 *
 * This is the observer pattern on Node's EventEmitter. `emitAsync` additionally WAITS for the
 * listeners, so the HTTP response only goes out once the database has been updated (otherwise
 * the client could ask for the leaderboard before the write finished). A failing listener is
 * logged but never breaks the game.
 *
 * AI assistance: drafted with Claude (Anthropic) and reviewed by the author.
 */
import { EventEmitter } from 'node:events';

export const EVENTS = {
  ANSWER_CHECKED: 'answer:checked',
  GAME_FINISHED: 'game:finished',
};

export class GameEvents extends EventEmitter {
  async emitAsync(name, payload) {
    const results = await Promise.allSettled(this.listeners(name).map((listener) => listener(payload)));
    for (const r of results) {
      if (r.status === 'rejected') console.error(`[events] "${name}" listener failed:`, r.reason);
    }
  }
}

export const gameEvents = new GameEvents();
