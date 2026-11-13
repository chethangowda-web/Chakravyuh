import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    // In dev, the browser calls same-origin /api/* and Vite forwards to FastAPI.
    proxy: {
      '/api': { target: process.env['API_PROXY_TARGET'] ?? 'http://127.0.0.1:8010', changeOrigin: true },
    },
  },
})
