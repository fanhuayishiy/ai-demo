import { defineConfig } from 'vite';
export default defineConfig({
  // Keep the committed preview portable under GitHub Pages project paths.
  base: './',
  server: { watch: { usePolling: true, interval: 500, ignored: ['**/output/**'] } },
  optimizeDeps: { include: ['three/addons/exporters/GLTFExporter.js'] },
  build: { rollupOptions: { output: { manualChunks: { 'three-core': ['three'] } } } },
});
