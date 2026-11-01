/**
 * INTEROPERABILITY
 * Avatars come from the third-party DiceBear web service (REST over HTTPS, returns SVG).
 * Our server acts as a proxy so the browser only talks to our origin (no CORS / CSP issues),
 * and we fall back to a locally generated SVG if the external service is unreachable.
 */
const cache = new Map();

function fallbackSvg(seed) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 360;
  const letter = (seed[0] || '?').toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="hsl(${h},70%,55%)"/><stop offset="1" stop-color="hsl(${(h + 60) % 360},70%,40%)"/>
  </linearGradient></defs>
  <rect width="100" height="100" rx="24" fill="url(#g)"/>
  <text x="50" y="64" font-family="Arial,sans-serif" font-size="46" font-weight="700" fill="#fff" text-anchor="middle">${letter}</text>
</svg>`;
}

export async function getAvatar(req, res) {
  const seed = String(req.params.seed || 'guest').slice(0, 40).replace(/[^\w-]/g, '');
  res.type('image/svg+xml').set('Cache-Control', 'public, max-age=86400');

  if (cache.has(seed)) return res.send(cache.get(seed));

  try {
    const url = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(seed)}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!resp.ok) throw new Error(`DiceBear responded ${resp.status}`);
    const svg = await resp.text();
    cache.set(seed, svg);
    return res.send(svg);
  } catch {
    return res.send(fallbackSvg(seed));
  }
}
