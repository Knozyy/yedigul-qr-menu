import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Yönetim paneli (panel/): menüden ayrı derlenir, /admin/ altında yayınlanır.
// Sunucu dist-panel/'i admin API'siyle aynı süreçte servis eder
// (server/panel/app.js). Tailwind kullanmaz; stili panel/src/styles.css.
export default defineConfig({
  root: 'panel',
  base: '/admin/',
  plugins: [react()],
  build: {
    outDir: '../dist-panel',
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    proxy: {
      '/admin/local-api': 'http://localhost:3001',
    },
  },
})
