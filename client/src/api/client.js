// Thin fetch wrapper around the REST API. The session lives in an httpOnly cookie, so no tokens in JS.
async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status; // lets callers react to 404 (no game) / 409 (out of sync) / 502 (Banana API down)
    throw err;
  }
  return data;
}

export const api = {
  register: (username, password) => request('/auth/register', { method: 'POST', body: { username, password } }),
  login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  startGame: () => request('/game/start', { method: 'POST' }),
  question: () => request('/game/question'),
  answer: (questionId, answer) => request('/game/answer', { method: 'POST', body: { questionId, answer } }),
  endGame: () => request('/game/end', { method: 'POST' }),

  leaderboard: () => request('/stats/leaderboard'),
  games: () => request('/stats/games'),
};
