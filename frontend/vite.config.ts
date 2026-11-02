import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Repassa as chamadas "/api" para o backend .NET (perfil "http" do launchSettings.json).
    // Assim o navegador fala só com o Vite e não há problema de CORS em desenvolvimento.
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL ?? 'http://localhost:5009',
        changeOrigin: true,
      },
    },
  },
})
