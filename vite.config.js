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
    rollupOptions: {
      external: ['canvaskit-wasm']
    }
  }
})
