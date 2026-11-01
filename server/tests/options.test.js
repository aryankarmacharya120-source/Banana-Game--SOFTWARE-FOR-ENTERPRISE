import test from 'node:test';
import assert from 'node:assert/strict';
import { generateOptions, shuffle } from '../src/game/options.js';

test('options: 4 unique digits that include the solution, for every possible solution', () => {
  for (let solution = 0; solution <= 9; solution++) {
    for (let i = 0; i < 200; i++) {
      const opts = generateOptions(solution);
      assert.equal(opts.length, 4);
      assert.equal(new Set(opts).size, 4);
      assert.ok(opts.includes(solution));
      assert.ok(opts.every((n) => Number.isInteger(n) && n >= 0 && n <= 9));
    }
  }
});

test('options: an unexpected out-of-range solution still works', () => {
  const opts = generateOptions(15);
  assert.equal(new Set(opts).size, 4);
  assert.ok(opts.includes(15));
  assert.ok(opts.every((n) => n >= 0));
});

test('options: the correct answer is not always in the same position', () => {
  const positions = new Set();
  for (let i = 0; i < 200; i++) positions.add(generateOptions(5).indexOf(5));
  assert.equal(positions.size, 4);
});

test('shuffle: keeps the same items and does not mutate its input', () => {
  const input = [1, 2, 3, 4, 5];
  const out = shuffle(input);
  assert.deepEqual([...out].sort(), input);
  assert.deepEqual(input, [1, 2, 3, 4, 5]);
});
