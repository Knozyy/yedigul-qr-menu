import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // tek domain düzeni: uygulama her ortamda /menu/ altında yaşar
  // (panel sunucusu, statik export ve dev aynı base'i kullanır)
  base: '/menu/',
  plugins: [react(), tailwindcss()],
  // `--mode static` (npm run build:menu) → hosting için statik export:
  // menü menu-data.json'dan okur, admin rotaları + qrcode pakete girmez.
  // (.env.static dosyası yerine derleme sabiti burada tanımlanır.)
  define: {
    'import.meta.env.VITE_STATIC': JSON.stringify(mode === 'static' ? '1' : ''),
    'import.meta.env.VITE_ADMIN_ENABLED': JSON.stringify(
      mode === 'static' || mode === 'public' ? '' : '1',
    ),
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
}))
