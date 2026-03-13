import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  plugins: [mkcert()],
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    target: 'es2020'
  },
  server: {
    port: 3000,
    open: true,
    https: true
  },
  resolve: {
    alias: {
      '@': '/src',
      '@config': '/src/config',
      '@core': '/src/core',
      '@entities': '/src/entities',
      '@systems': '/src/systems',
      '@rendering': '/src/rendering',
      '@utils': '/src/utils'
    }
  }
});
