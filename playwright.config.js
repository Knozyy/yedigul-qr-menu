import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  // Tek paylaşılan (in-memory) backend'e iki proje (masaüstü + iPhone) vurur;
  // testler global veriyi değiştirdiğinden paralel koşumda aynı satırı iki proje
  // aynı anda değiştirip yarışır. Seri koş + her test kendi durumunu geri alsın.
  workers: 1,
  use: { baseURL: 'http://localhost:5173' },
  projects: [
    {
      name: 'chromium-iphone-12',
      use: { ...devices['iPhone 12'], browserName: 'chromium' },
    },
    {
      // CLAUDE.md: menü/panel masaüstünde de düzgün olmalı — aynı akışlar
      // masaüstü viewport'unda da koşar
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev:server',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      env: { ADMIN_PASSWORD: 'e2e-pass', JWT_SECRET: 'e2e-secret', DB_PATH: ':memory:', UPLOADS_DIR: 'server/uploads' },
    },
    {
      // yalnız Vite (npm run dev artık API'yi de başlatıyor; burada API'yi
      // yukarıdaki webServer başlattığı için 3001 çakışmasın diye ayrık)
      command: 'npm run dev:vite',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
