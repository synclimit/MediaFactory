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
        target: 'http://localhost:18888',
        changeOrigin: true
      }
    },
    watch: {
      ignored: ['**/Output/**', '**/.mediafactory/**', '**/Workspace/**']
    }
  },
  build: {
    assetsDir: 'app-assets',
    rollupOptions: {
      external: ['canvaskit-wasm']
    },
    rolldownOptions: {
      external: ['canvaskit-wasm']
    }
  }
})
