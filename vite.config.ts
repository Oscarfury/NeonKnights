import { defineConfig } from 'vite';
export default defineConfig({
  base: '/NeonKnights/',
  build: {
    rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } },
    chunkSizeWarningLimit: 1600,
  },
});
