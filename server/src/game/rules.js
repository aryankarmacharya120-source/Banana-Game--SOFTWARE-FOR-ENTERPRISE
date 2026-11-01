/**
 * Game rules in one place so they are easy to tune and to explain.
 *
 * A "run" starts with STARTING_LIVES lives. Each correct answer scores points (with a small
 * streak bonus); each wrong answer costs a life and resets the streak. The run ends when the
 * lives reach zero, or when the player cashes out early.
 */
export const STARTING_LIVES = 3;
export const BASE_POINTS = 10;
export const STREAK_BONUS = 2; // extra points per consecutive correct answer after the first
export const MAX_STREAK_BONUS = 10;

export const OPTION_COUNT = 4;

// The Banana puzzle asks for a single missing digit, so solutions are 0-9.
export const SOLUTION_MIN = 0;
export const SOLUTION_MAX = 9;

export const SESSION_IDLE_MS = 30 * 60 * 1000;

/** Points for a correct answer, given the streak length INCLUDING this answer (>= 1). */
export const pointsFor = (streak) => BASE_POINTS + Math.min((streak - 1) * STREAK_BONUS, MAX_STREAK_BONUS);
