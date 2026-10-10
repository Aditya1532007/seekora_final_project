/// <reference types="node" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const apiTarget = 'http://localhost:8080';

function reactAppPath(url: string | undefined): string | undefined {
  if (!url) return url;
  const [pathname, query] = url.split('?', 2);
  if (pathname !== '/app' && pathname !== '/app/') return url;
  return `/react-app.html${query ? `?${query}` : ''}`;
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'seekora-app-route',
      configureServer(server) {
        server.middlewares.use((request, _response, next) => {
          request.url = reactAppPath(request.url);
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((request, _response, next) => {
          request.url = reactAppPath(request.url);
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // Allow Vercel sandbox previews while keeping Vite's host checks enabled.
    allowedHosts: ['.vercel.run', 'flyable-spotlight-antiques.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => `/seekora${path}`,
        cookiePathRewrite: '/',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyRequest, request) => {
            const origin = request.headers.origin;
            if (origin && origin === `http://${request.headers.host}`) {
              proxyRequest.setHeader('Origin', apiTarget);
            }
          });
        },
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        landing: fileURLToPath(new URL('./index.html', import.meta.url)),
        reactApp: fileURLToPath(new URL('./react-app.html', import.meta.url)),
      },
    },
  },
});
