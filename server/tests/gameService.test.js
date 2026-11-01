import test from 'node:test';
import assert from 'node:assert/strict';
import { GameService } from '../src/game/gameService.js';
import { GameEvents, EVENTS } from '../src/events/gameEvents.js';
import { SESSION_IDLE_MS } from '../src/game/rules.js';

// Test harness: questions come from a queue of known solutions, events are recorded.
function setup(solutions = [3, 4, 5, 6, 7, 8, 9], opts = {}) {
  let n = 0;
  let clock = 1_000;
  const events = new GameEvents();
  const log = { answers: [], finished: [] };
  events.on(EVENTS.ANSWER_CHECKED, (p) => log.answers.push(p));
  events.on(EVENTS.GAME_FINISHED, (p) => log.finished.push(p));
  const state = { fail: false };
  const service = new GameService({
    events,
    now: () => clock,
    getQuestion: async () => {
      if (state.fail) throw new Error('Banana API unavailable');
      const solution = solutions[n++ % solutions.length];
      return { imageUrl: `https://example.test/${n}.png`, solution };
    },
    ...opts,
  });
  return { service, log, state, tick: (ms) => (clock += ms) };
}

const right = (service, uid, state, solution) =>
  service.answer(uid, { questionId: state.question.id, answer: solution });
const wrongOption = (state, solution) => state.question.options.find((o) => o !== solution);

test('start returns a question with 4 options and never exposes the solution', async () => {
  const { service } = setup();
  const state = await service.start('u1');
  assert.equal(state.question.options.length, 4);
  assert.equal(state.lives, 3);
  assert.equal(state.score, 0);
  assert.ok(!JSON.stringify(state).includes('solution'));
});

test('correct answers score 10, then 12 with a streak', async () => {
  const { service } = setup([3, 4]);
  let state = await service.start('u1');
  let r = await right(service, 'u1', state, 3);
  assert.deepEqual([r.correct, r.points, r.state.score, r.state.streak], [true, 10, 10, 1]);
  state = await service.question('u1');
  r = await right(service, 'u1', state, 4);
  assert.deepEqual([r.points, r.state.score, r.state.streak], [12, 22, 2]);
});

test('wrong answer costs a life, resets the streak and reveals the solution', async () => {
  const { service } = setup([3, 4]);
  let state = await service.start('u1');
  await right(service, 'u1', state, 3);
  state = await service.question('u1');
  const r = await service.answer('u1', { questionId: state.question.id, answer: wrongOption(state, 4) });
  assert.equal(r.correct, false);
  assert.equal(r.correctAnswer, 4);
  assert.equal(r.state.lives, 2);
  assert.equal(r.state.streak, 0);
  assert.equal(r.state.score, 10);
  assert.equal(r.state.bestStreak, 1);
});

test('three wrong answers end the game, emit game:finished once, and clear the session', async () => {
  const { service, log } = setup([3]);
  let result;
  for (let i = 0; i < 3; i++) {
    const state = await service.question('u1').catch(() => service.start('u1'));
    result = await service.answer('u1', { questionId: state.question.id, answer: wrongOption(state, 3) });
  }
  assert.equal(result.gameOver, true);
  assert.equal(result.summary.endedBy, 'lives');
  assert.equal(result.summary.wrong, 3);
  assert.equal(log.finished.length, 1);
  assert.equal(log.answers.length, 3);
  await assert.rejects(service.question('u1'), { status: 404 });
});

test('a double-submitted or stale answer is rejected and scores only once', async () => {
  const { service } = setup([3]);
  const state = await service.start('u1');
  const first = right(service, 'u1', state, 3);
  const second = right(service, 'u1', state, 3);
  const results = await Promise.allSettled([first, second]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(results.find((r) => r.status === 'rejected').reason.status, 409);
  assert.equal((await service.question('u1')).score, 10);
});

test('an answer that is not one of the offered options is rejected', async () => {
  const { service } = setup([3]);
  const state = await service.start('u1');
  const bad = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 42].find((n) => !state.question.options.includes(n));
  await assert.rejects(service.answer('u1', { questionId: state.question.id, answer: bad }), { status: 400 });
  await assert.rejects(service.answer('u1', { questionId: state.question.id, answer: 'abc' }), { status: 400 });
});

test('end() banks the run; a run with no answers is not recorded', async () => {
  const { service, log } = setup([3]);
  let state = await service.start('u1');
  await service.end('u1');
  assert.equal(log.finished.length, 0);

  state = await service.start('u1');
  await right(service, 'u1', state, 3);
  const summary = await service.end('u1');
  assert.equal(summary.score, 10);
  assert.equal(summary.endedBy, 'quit');
  assert.equal(log.finished.length, 1);
});

test('starting a new run banks the one in progress', async () => {
  const { service, log } = setup([3]);
  const state = await service.start('u1');
  await right(service, 'u1', state, 3);
  await service.start('u1');
  assert.equal(log.finished.length, 1);
  assert.equal(log.finished[0].score, 10);
});

test('players have independent runs', async () => {
  const { service } = setup([3, 4]);
  const a = await service.start('a');
  const b = await service.start('b');
  await right(service, 'a', a, 3);
  assert.equal((await service.question('b')).score, 0);
  assert.equal(b.score, 0);
});

test('if the Banana API fails, the run survives and the question can be retried', async () => {
  const { service, state } = setup([3]);
  state.fail = true;
  await assert.rejects(service.start('u1'), /unavailable/);
  await assert.rejects(service.answer('u1', { questionId: 'x', answer: 3 }), { status: 409 });
  state.fail = false;
  const retry = await service.question('u1');
  assert.equal(retry.question.options.length, 4);
});

test('idle runs expire', async () => {
  const { service, tick } = setup([3]);
  await service.start('u1');
  tick(SESSION_IDLE_MS + 1);
  await assert.rejects(service.question('u1'), { status: 404 });
});

test('a failing event listener never breaks the game', async () => {
  const { service } = setup([3]);
  service.events.on(EVENTS.ANSWER_CHECKED, async () => {
    throw new Error('db down');
  });
  const original = console.error;
  console.error = () => {};
  try {
    const state = await service.start('u1');
    const r = await right(service, 'u1', state, 3);
    assert.equal(r.correct, true);
  } finally {
    console.error = original;
  }
});
