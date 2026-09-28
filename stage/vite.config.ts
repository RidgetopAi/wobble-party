import { defineConfig } from 'vite';

// In dev, proxy the brain's endpoints so `npm run dev` works against a
// running `wobble-brain serve`.
const brain = 'http://127.0.0.1:7477';

export default defineConfig({
  base: './',
  build: { outDir: 'dist', chunkSizeWarningLimit: 2000, target: 'es2022' },
  server: {
    port: 5188,
    host: '127.0.0.1',
    proxy: {
      '/ws': { target: brain.replace('http', 'ws'), ws: true },
      '/theme': brain,
      '/themes': brain,
    },
  },
});
