import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      strict: false
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:18888',
        changeOrigin: true,
        router: async () => {
          const http = await import('http');
          const ports = [18888, 3001, 3002, 3003, 8080, 8888];
          for (const p of ports) {
            const alive = await new Promise((resolve) => {
              const req = http.get(`http://127.0.0.1:${p}/api/v1/diagnostics/health`, { timeout: 300 }, (res) => resolve(res.statusCode < 500));
              req.on('error', () => resolve(false));
              req.on('timeout', () => { req.destroy(); resolve(false); });
            });
            if (alive) return `http://127.0.0.1:${p}`;
          }
          return 'http://127.0.0.1:18888';
        }
      }
    },
    watch: {
      ignored: ['**/Output/**', '**/.mediafactory/**', '**/Workspace/**']
    }
  },
  build: {
    emptyOutDir: false,
    assetsDir: 'app-assets',
    rollupOptions: {
      external: ['canvaskit-wasm']
    },
    rolldownOptions: {
      external: ['canvaskit-wasm']
    }
  }
})
