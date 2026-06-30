import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: { baseURL: 'http://localhost:5173' },
  projects: [
    {
      name: 'chromium-iphone-12',
      use: { ...devices['iPhone 12'], browserName: 'chromium' },
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
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
