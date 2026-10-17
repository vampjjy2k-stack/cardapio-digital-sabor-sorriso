import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const executablePath = process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);

export default defineConfig({
  testDir: 'tests/ui',
  testMatch: '**/*.spec.js',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  workers: 4,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true,
    launchOptions: { executablePath, args: ['--no-sandbox'] },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1 --directory public',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: false,
    timeout: 15_000,
  },
});
