/**
 * Multiple-choice option generation.
 *
 * REFERENCE: adapted from generateOptions() in keshavroka55/banana (client/js/script.js), which
 * builds a Set containing the correct answer plus three wrong answers near it, then shuffles.
 * Changes made here (and why):
 *  - Wrong answers are drawn from the 0-9 range the Banana puzzle uses. The reference produced
 *    values like 14 or 12 for a single-digit answer, which can be eliminated at a glance.
 *  - Uses a Fisher-Yates shuffle; `sort(() => Math.random() - 0.5)` is a biased shuffle.
 *  - Runs on the server, and `rng` is injectable so the behaviour can be unit tested.
 *
 * AI assistance: drafted with Claude (Anthropic) and reviewed by the author.
 */
import { OPTION_COUNT, SOLUTION_MAX, SOLUTION_MIN } from './rules.js';

/** Unbiased shuffle. Returns a new array. */
export function shuffle(items, rng = Math.random) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Returns OPTION_COUNT unique, non-negative integers that include `solution`, in random order. */
export function generateOptions(solution, rng = Math.random) {
  // If the API ever returned a value outside 0-9 the range stretches to include it.
  const lo = Math.min(SOLUTION_MIN, solution);
  const hi = Math.max(SOLUTION_MAX, solution);

  const pool = [];
  for (let n = lo; n <= hi; n++) if (n !== solution) pool.push(n);

  const wrong = shuffle(pool, rng).slice(0, OPTION_COUNT - 1);
  return shuffle([solution, ...wrong], rng);
}
