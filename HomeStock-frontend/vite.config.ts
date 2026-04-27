  import { defineConfig } from 'vite';
  import tailwindcss from '@tailwindcss/vite';
  import react from '@vitejs/plugin-react'
  import path from 'path';

  export default defineConfig({
    plugins: [
      tailwindcss(),
      react()
    ],
    server: {
      proxy: {
        '/api': {
          target: process.env.VITE_BACKEND_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, ''),
          secure: false,
          ws: true,
        },
      },
    },
    resolve: {
      alias: {
        "@spe_types": path.resolve(__dirname, './src/types'),
        "@components": path.resolve(__dirname, './src/components'),
        "@pages": path.resolve(__dirname, './src/pages'),
        "@lib": path.resolve(__dirname, './src/lib'),
        "@config": path.resolve(__dirname, './src/config'),
        "@services": path.resolve(__dirname, './src/services'),
      }
    }
  });