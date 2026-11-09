import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 5173, host: '127.0.0.1' },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: { manualChunks: { phaser: ['phaser'] } },
    },
  },
});
