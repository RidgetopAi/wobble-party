import { defineConfig, type Plugin } from 'vite';

// In dev, proxy the brain's endpoints so `npm run dev` works against a
// running `wobble-brain serve --dev-origin http://127.0.0.1:5188`.
const brain = 'http://127.0.0.1:7477';

// The minifier drops three.js's @license header; put the notice back after
// minification. Full text: licenses/three.js.txt (shipped in dist too).
const THREE_NOTICE = '/*! three.js | Copyright 2010-2026 Three.js Authors | MIT License | licenses/three.js.txt */\n';
const licenseNotice: Plugin = {
  name: 'three-license-notice',
  enforce: 'post',
  generateBundle(_, bundle) {
    for (const out of Object.values(bundle)) {
      if (out.type === 'chunk' && out.name.startsWith('three')) out.code = THREE_NOTICE + out.code;
    }
  },
};

export default defineConfig({
  base: './',
  plugins: [licenseNotice],
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
