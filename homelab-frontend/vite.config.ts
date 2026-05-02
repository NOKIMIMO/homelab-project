import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    host: true,
    port: 80,
    watch: {
      usePolling: true
    },
    proxy: {
      '/api': {
        target: 'http://homelab-backend:8080',
        changeOrigin: true,
        secure: false
      }
    }
  }
});