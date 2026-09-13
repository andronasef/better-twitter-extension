import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  retries: 0,
  workers: 1,
  use: {
    ...devices['Desktop Chrome'],
    headless: false, // Chrome extensions require headful mode in Chromium
  },
});