import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({
  base: '/NeonKnights/',
  build: {
    rollupOptions: {
      input: { main: resolve('index.html'), next: resolve('next/index.html') },
      output: { manualChunks: { phaser: ['phaser'], three: ['three'] } },
    },
    chunkSizeWarningLimit: 1600,
  },
});
