import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // tek domain düzeni: uygulama her ortamda /menu/ altında yaşar
  // (panel sunucusu, statik export ve dev aynı base'i kullanır)
  base: '/menu/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
})
