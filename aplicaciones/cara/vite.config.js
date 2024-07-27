import { defineConfig } from 'vite';

export default defineConfig({
  // base: '/',
  server: {
    port: 4001,
  },
  publicDir: 'estaticos',
  build: {
    outDir: 'publico',
    assetsDir: 'estaticos',
    sourcemap: true,
  },
});
