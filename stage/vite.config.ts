import { defineConfig } from 'vite';

// In dev, proxy the brain's endpoints so `npm run dev` works against a
// running `wobble-brain serve`.
const brain = 'http://127.0.0.1:7477';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2022',
    // The marketplace's security scan skips (and fails) any file over 512 KiB,
    // so three.js is split out of the app bundle. Keep every chunk under it.
    chunkSizeWarningLimit: 480,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'three-core', test: /three[\\/]build[\\/]three\.core/ },
            { name: 'three', test: /node_modules[\\/]three/ },
          ],
        },
      },
    },
  },
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
