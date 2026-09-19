import { defineConfig } from 'vite';

export default defineConfig({
  // 相对 base：产物可以直接放进任意子路径（GitHub Pages 的 /ai-demo/<project>/dist/）。
  // 开发服务器不受影响（入口由 Vite 自己注入）。
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
  },
  build: {
    target: 'esnext',
    minify: false,
    sourcemap: false,
    chunkSizeWarningLimit: 4096,
    assetsInlineLimit: 0,
  },
  esbuild: {
    legalComments: 'none',
  },
});
