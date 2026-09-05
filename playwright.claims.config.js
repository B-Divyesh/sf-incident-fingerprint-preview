import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './site/tests',
  testMatch: 'claims.spec.js',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  reporter: 'line',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4174',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npx vite preview --config site/vite.config.js --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false
  }
});
