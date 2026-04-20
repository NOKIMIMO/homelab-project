import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react'

const backendTarget = process.env.VITE_BACKEND_PROXY_TARGET ?? 'http://localhost:8081';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      '/storage': {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  }
});