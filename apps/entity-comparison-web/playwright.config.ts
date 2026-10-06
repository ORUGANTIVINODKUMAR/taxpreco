import { defineConfig } from '@playwright/test'
import { fileURLToPath } from 'node:url'
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5199',
    channel: process.platform === 'win32' ? 'chrome' : undefined,
    headless: true,
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev',
      cwd: fileURLToPath(new URL('../../services/entity-comparison-api/', import.meta.url)),
      url: 'http://127.0.0.1:3002/api/health',
      env: { NODE_ENV: 'development', AUTH_MODE: 'mock', HOST: '127.0.0.1', PORT: '3002', TAPRECO_ALLOWED_ORIGIN: 'http://127.0.0.1:5199', SERVE_FRONTEND: 'false' },
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5199 --strictPort',
      url: 'http://127.0.0.1:5199',
      env: { VITE_API_BASE_URL: 'http://127.0.0.1:3002' },
      reuseExistingServer: false,
    },
  ],
})
