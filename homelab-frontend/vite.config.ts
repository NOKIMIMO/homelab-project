/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@app': resolve(__dirname, 'src/app'),
      '@auth': resolve(__dirname, 'src/auth'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@ui': resolve(__dirname, 'src/components'),
      '@renderer': resolve(__dirname, 'src/components/modules'),
      '@lib': resolve(__dirname, 'src/lib'),
      '@features': resolve(__dirname, 'src/features'),
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/**/*.d.ts',
        'src/**/types.ts',
        'src/app/types.ts',
      ],
    },
  },
  server: {
    cors: true,
    host: true,
    port: 80,
    watch: {
      usePolling: true
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      }
    }
  }
});