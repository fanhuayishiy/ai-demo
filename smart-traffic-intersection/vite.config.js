import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('three.core.js')) return 'three-core';
          if (id.includes('three.module.js')) return 'three-renderer';
          if (id.includes('/three/examples/')) return 'three-tools';
        }
      }
    }
  }
});
