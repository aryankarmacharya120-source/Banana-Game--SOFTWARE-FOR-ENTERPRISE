import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchBananaQuestion, UpstreamError } from '../src/services/bananaClient.js';

const respond = (body, ok = true, status = 200) => async () => ({ ok, status, json: async () => body });

test('parses the Banana API response shape', async () => {
  const q = await fetchBananaQuestion({ fetchImpl: respond({ question: 'https://example.test/q.png', solution: '7' }) });
  assert.deepEqual(q, { imageUrl: 'https://example.test/q.png', solution: 7 });
});

test('accepts a numeric solution of 0', async () => {
  const q = await fetchBananaQuestion({ fetchImpl: respond({ question: 'https://example.test/q.png', solution: 0 }) });
  assert.equal(q.solution, 0);
});

for (const [name, body] of [
  ['missing solution', { question: 'https://example.test/q.png' }],
  ['null solution', { question: 'https://example.test/q.png', solution: null }],
  ['non-numeric solution', { question: 'https://example.test/q.png', solution: 'x' }],
  ['negative solution', { question: 'https://example.test/q.png', solution: -2 }],
  ['missing image', { solution: 3 }],
  ['javascript: image url', { question: 'javascript:alert(1)', solution: 3 }],
]) {
  test(`rejects a bad response: ${name}`, async () => {
    await assert.rejects(fetchBananaQuestion({ fetchImpl: respond(body), attempts: 1 }), UpstreamError);
  });
}

test('HTTP errors and network failures become a 502 UpstreamError', async () => {
  await assert.rejects(fetchBananaQuestion({ fetchImpl: respond({}, false, 503), attempts: 1 }), { status: 502 });
  await assert.rejects(
    fetchBananaQuestion({ fetchImpl: async () => { throw new Error('ECONNRESET'); }, attempts: 1 }),
    /ECONNRESET/
  );
});

test('retries once before giving up', async () => {
  let calls = 0;
  const flaky = async () => {
    calls++;
    if (calls === 1) throw new Error('timeout');
    return { ok: true, json: async () => ({ question: 'https://example.test/q.png', solution: 4 }) };
  };
  const q = await fetchBananaQuestion({ fetchImpl: flaky, attempts: 2 });
  assert.equal(q.solution, 4);
  assert.equal(calls, 2);
});
