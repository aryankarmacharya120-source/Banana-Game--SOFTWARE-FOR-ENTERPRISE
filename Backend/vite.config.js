import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev proxy keeps API + WebSocket on the page's origin, so the httpOnly auth cookie flows without CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/socket.io': { target: 'http://localhost:5000', ws: true },
    },
  },
});
