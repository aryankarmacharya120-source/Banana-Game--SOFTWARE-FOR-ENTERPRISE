import http from 'node:http';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { initSockets } from './sockets/index.js';

async function main() {
  await connectDB();
  const server = http.createServer(createApp());
  initSockets(server);
  server.listen(env.port, () => console.log(`[server] listening on http://localhost:${env.port}`));
}

main().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
