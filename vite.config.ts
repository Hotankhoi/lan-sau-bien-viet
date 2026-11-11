import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages: https://hotankhoi.github.io/lan-sau-bien-viet/
  base: '/lan-sau-bien-viet/',
  server: { port: 5173, host: '127.0.0.1' },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: { manualChunks: (id: string) => (id.includes('node_modules/phaser') ? 'phaser' : undefined) },
    },
  },
});
