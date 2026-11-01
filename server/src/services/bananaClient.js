/**
 * INTEROPERABILITY - Banana API client
 *
 * The Banana API (University of Bedfordshire example resource, hosted by Marc Conrad) returns a
 * puzzle image plus its solution as JSON over HTTPS:
 *     GET https://marcconrad.com/uob/banana/api.php?out=json&base64=no
 *     -> { "question": "<image url>", "solution": <digit> }
 *
 * REFERENCE: endpoint and response shape taken from keshavroka55/banana (client/js/script.js).
 * Difference: the reference calls the API from the browser and keeps the solution in client
 * memory, so a player could read it from DevTools. Here the SERVER calls the API and keeps the
 * solution; the browser only receives the image URL and the answer options. That keeps the
 * leaderboard trustworthy and lets us validate and time-limit the third-party response.
 *
 * AI assistance: drafted with Claude (Anthropic) and reviewed by the author.
 */
import { env } from '../config/env.js';

export class UpstreamError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UpstreamError';
    this.status = 502; // Bad Gateway: our server is fine, the service we depend on is not
  }
}

const parseSolution = (raw) =>
  typeof raw === 'number' || (typeof raw === 'string' && raw.trim() !== '') ? Number(raw) : NaN;

function parseImageUrl(raw) {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null; // no javascript:/data: URLs
  } catch {
    return null;
  }
}

/** Fetches one question. Returns { imageUrl, solution } or throws UpstreamError. */
export async function fetchBananaQuestion({ fetchImpl = fetch, url = env.bananaApiUrl, timeoutMs = 5000, attempts = 2 } = {}) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs), headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const solution = parseSolution(data?.solution);
      const imageUrl = parseImageUrl(data?.question);
      if (!imageUrl || !Number.isInteger(solution) || solution < 0) throw new Error('unexpected response shape');
      return { imageUrl, solution };
    } catch (err) {
      lastError = err;
    }
  }
  throw new UpstreamError(`Banana API unavailable (${lastError?.message || 'unknown error'})`);
}
