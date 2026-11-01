import http from 'node:http';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { registerGameListeners } from './events/gameListeners.js';
import { gameService } from './controllers/gameController.js';

async function main() {
  await connectDB();
  registerGameListeners();
  setInterval(() => gameService.sweepExpired(), 5 * 60 * 1000).unref();

  const server = http.createServer(createApp());
  server.listen(env.port, () => console.log(`[server] listening on http://localhost:${env.port}`));
}

main().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
