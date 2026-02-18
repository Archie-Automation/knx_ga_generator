import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  define: {
    'import.meta.env.APP_VERSION': JSON.stringify(pkg.version || '0.0.0'),
  },
  plugins: [react()],
  optimizeDeps: {
    include: ['jspdf'],
  },
  server: {
    port: 5173,
    strictPort: true,
    host: host ?? false,
    hmr: host
      ? { protocol: 'ws', host, port: 1421 }
      : { overlay: true },
    watch: {
      ignored: ['**/src-tauri/**']
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  clearScreen: false
});











