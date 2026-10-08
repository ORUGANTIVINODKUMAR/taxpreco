import { defineConfig } from '@playwright/test'
import { fileURLToPath } from 'node:url'
const env = {
  VITE_PORTAL_URL: 'http://127.0.0.1:3099', VITE_APP_API_URL: 'http://127.0.0.1:3098',
  VITE_TOOLS_API_URL: 'http://127.0.0.1:4099', VITE_APP_FIREBASE_API_KEY: 'fake-api-key',
  VITE_APP_FIREBASE_AUTH_DOMAIN: 'maigha-taxpro.firebaseapp.com',
  VITE_APP_FIREBASE_PROJECT_ID: 'maigha-taxpro', VITE_APP_FIREBASE_APP_ID: '1:123:web:test',
}
export default defineConfig({
  testDir: './tests', testMatch: '**/*.spec.ts', fullyParallel: false, workers: 1, timeout: 45000,
  expect: { timeout: 10000 }, reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5199', channel: process.platform === 'win32' ? 'msedge' : undefined,
    headless: true, viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: [
    ['entity-comparison-web', 5199], ['estimated-tax-web', 5198], ['audit-risk-web', 5197],
  ].map(([app, port]) => ({
    command: 'npm run dev -- --host 127.0.0.1 --port ' + port + ' --strictPort',
    cwd: fileURLToPath(new URL('../' + app + '/', import.meta.url)),
    url: 'http://127.0.0.1:' + port, env, reuseExistingServer: false,
  })),
})
